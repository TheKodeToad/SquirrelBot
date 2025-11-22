import { moduleLogger } from "#common/logger/index.ts";
import { TTLMap } from "#common/ttlMap.ts";
import type { SquirrelDiscordContext } from "#discord/index.ts";
import { AUTO_DEFER_AFTER, STATE_CLEANUP_INTERVAL, STATE_EXPIRE_AFTER } from "#plugin/core/commandEngine/index.ts";
import { transformReply } from "#plugin/core/helper/commands.ts";
import type { ComponentContext, Reply, ReplyObject } from "#plugin/core/public/command.ts";
import { onBotEvent } from "#plugin/core/public/extensionPoints.ts";
import { Text } from "oceanic-component-helper";
import { ComponentInteraction, Guild, Member, MessageFlags, Shard, User, type AnyInteractionGateway, type AnyTextableGuildChannel, type MessageComponentTypes } from "oceanic.js";

interface ComponentHandler {
	callback: NonNullable<ReplyObject["componentHandler"]>;
	originalUserID: string;
}

const logger = moduleLogger();

const activeHandlers: TTLMap<string, ComponentHandler> = new TTLMap(STATE_EXPIRE_AFTER);
setInterval(() => activeHandlers.cleanup(), STATE_CLEANUP_INTERVAL).unref();

export default [
	onBotEvent({ type: "interactionCreate", listener: handle })
];

async function handle(squirrelCtx: SquirrelDiscordContext, interaction: AnyInteractionGateway): Promise<void> {
	if (!interaction.inCachedGuildChannel()) {
		return;
	}

	if (!interaction.isComponentInteraction()) {
		return;
	}

	const handler = activeHandlers.get(interaction.message.id);

	if (handler === undefined) {
		return;
	}

	const ctx = new ComponentContextImpl(squirrelCtx, interaction, handler.originalUserID);

	try {
		const values = "values" in interaction.data ? interaction.data.values.raw : undefined;

		await handler.callback(ctx, interaction.data.customID, values);
	} catch (error) {
		try {
			await ctx.respond({
				components: [Text(":boom: Something went wrong while processing your action")],
				flags: MessageFlags.EPHEMERAL
			});
		} catch (error) {
			logger.error?.("Error responding with error to component", error);
		}
		throw error;
	} finally {
		await ctx._abandon();
	}
}

export function listenForInteractions(messageID: string, originalUserID: string, callback: ComponentHandler["callback"]): void {
	activeHandlers.set(messageID, { callback, originalUserID });
}

export function unlistenForInteractions(messageID: string): void {
	activeHandlers.delete(messageID);
}

class ComponentContextImpl implements ComponentContext {
	originalUserID: string;

	squirrelCtx: SquirrelDiscordContext;
	get bot() { return this.squirrelCtx.bot; }
	get shard(): Shard { return this._interaction.guild.shard; }
	get guild(): Guild { return this._interaction.guild; }
	get user(): User { return this._interaction.user; };
	get member(): Member { return this._interaction.member; }
	get channel(): AnyTextableGuildChannel { return this._interaction.channel; }

	_interaction: ComponentInteraction<MessageComponentTypes, AnyTextableGuildChannel>;
	_responseID: string | null;
	_acked: boolean;
	_edited: boolean;
	_ackPromise: Promise<void> | null;
	_ackTimeout: NodeJS.Timeout | null;

	constructor(squirrelCtx: SquirrelDiscordContext, interaction: ComponentInteraction<MessageComponentTypes, AnyTextableGuildChannel>, originalUserID: string) {
		this.squirrelCtx = squirrelCtx;
		this._interaction = interaction;
		this.originalUserID = originalUserID;
		this._responseID = null;
		this._acked = false;
		this._edited = false;
		this._ackTimeout = setTimeout(() => {
			this._ackTimeout = null;
			this._acked = true;
			this._ackPromise = interaction.deferUpdate().then(() => { });
		}, Math.max(0, AUTO_DEFER_AFTER - (Date.now() - interaction.createdAt.getTime()))).unref();
		this._ackPromise = null;
	}

	async respond(reply: Reply): Promise<void> {
		const messageOptions = transformReply(reply);

		if (this._responseID !== null) {
			unlistenForInteractions(this._responseID);

			await this._interaction.editFollowup(this._responseID, messageOptions).then(message => this._responseID ??= message?.id ?? null);
		} else {
			if (this._acked) {
				await this._ackPromise;
			} else {
				this._clearTimeout();
			}

			if (this._edited) {
				await this._interaction.createFollowup(messageOptions).then(response => this._responseID = response.message.id);
			} else {
				await this._interaction.createMessage(messageOptions).then(
					({ callback }) => this._responseID ??= callback.resource?.message?.id ?? null
				);
			}

			this._acked = true;
		}

		if (typeof reply !== "string" && reply.componentHandler !== undefined && this._responseID !== null) {
			listenForInteractions(this._responseID, this.originalUserID, reply.componentHandler);
		}
	}

	async edit(reply: Reply): Promise<void> {
		const messageOptions = transformReply(reply);

		unlistenForInteractions(this._interaction.message.id);

		if (this._acked) {
			await this._ackPromise;
			await this._interaction.message.edit(messageOptions);
		} else {
			this._clearTimeout();
			this._edited = true;
			await this._interaction.editParent(messageOptions);
			this._acked = true;
		}

		if (typeof reply !== "string" && reply.componentHandler !== undefined) {
			listenForInteractions(this._interaction.message.id, this.originalUserID, reply.componentHandler);
		}
	}

	_clearTimeout(): void {
		if (this._ackTimeout !== null) {
			clearTimeout(this._ackTimeout);
			this._ackTimeout = null;
		}
	}

	async _abandon(): Promise<void> {
		this._clearTimeout();

		if (!this._acked) {
			await this._interaction.deferUpdate();
		}
	}
}
