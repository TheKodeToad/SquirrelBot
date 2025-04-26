import { ComponentInteraction, ComponentTypes, Guild, Member, MessageFlags, Shard, User, type AnyTextableGuildChannel, type MessageComponentTypes } from "oceanic.js";
import { moduleLogger } from "../../../../../common/logger/index.ts";
import { TTLMap } from "../../../../../common/ttlMap.ts";
import { transformReply } from "../../helper/commands.ts";
import type { AnyCommandComponentWithCallback, CommandActionRow, CommandComponent, CommandComponentCallback, CommandContainerComponent, CommandSectionComponent, ComponentContext, Reply } from "../../public/command.ts";
import { defineEventListener } from "../../public/eventListener.ts";
import { AUTO_DEFER_AFTER, STATE_CLEANUP_INTERVAL, STATE_EXPIRE_AFTER } from "../index.ts";

interface ComponentData {
	callbacks: Map<string, Required<CommandComponentCallback>>;
	invokerID: string;
}

const logger = moduleLogger();

const activeComponents: TTLMap<string, ComponentData> = new TTLMap(STATE_EXPIRE_AFTER);
setInterval(() => activeComponents.cleanup(), STATE_CLEANUP_INTERVAL).unref();

export const componentInterationHandler = defineEventListener("interactionCreate", async interaction => {
	if (!interaction.inCachedGuildChannel())
		return;

	if (!interaction.isComponentInteraction())
		return;

	const componentData = activeComponents.get(interaction.message.id);

	if (componentData === undefined)
		return;

	const callback = componentData.callbacks.get(interaction.data.customID);

	if (callback === undefined)
		return;

	if (callback.invokerOnly && interaction.user.id !== componentData.invokerID) {
		// just ignore
		interaction.deferUpdate();
		return;
	}

	const context = new ComponentContextImpl(interaction, componentData.invokerID);

	try {
		const values = "values" in interaction.data ? interaction.data.values.raw : [];

		await callback.callback(context, values);
	} catch (error) {
		try {
			await context.respond({
				components: [{ content: ":boom: Something went wrong while processing your action", type: ComponentTypes.TEXT_DISPLAY }],
				flags: MessageFlags.EPHEMERAL
			});
		} catch (error) {
			logger.error?.("Error responding with error to component", error);
		}
		// HACK for now
		throw error;
	} finally {
		await context._abandon();
	}
});

export function listenForInteractions(messageID: string, invokerID: string, components: CommandComponent[]): void {
	const callbacks: ComponentData["callbacks"] = new Map;

	for (const component of components) {
		if (component.type === ComponentTypes.ACTION_ROW)
			putCallbacksForActionRow(callbacks, component);
		else if (component.type === ComponentTypes.SECTION)
			putCallbackForSection(callbacks, component);
		else if (component.type === ComponentTypes.CONTAINER) {
			putCallbacksForContainer(callbacks, component);
		}
	}

	activeComponents.set(messageID, { callbacks, invokerID: invokerID });
}

export function putCallbacksForActionRow(callbacks: ComponentData["callbacks"], row: CommandActionRow): void {
	for (const action of row.components)
		if ("callback" in action)
			putCallback(callbacks, action);
}

export function putCallbackForSection(callbacks: ComponentData["callbacks"], section: CommandSectionComponent): void {
	if ("callback" in section.accessory)
		putCallback(callbacks, section.accessory);
}

export function putCallbacksForContainer(callbacks: ComponentData["callbacks"], section: CommandContainerComponent): void {
	for (const component of section.components) {
		if (component.type === ComponentTypes.ACTION_ROW)
			putCallbacksForActionRow(callbacks, component);
		else if (component.type === ComponentTypes.SECTION)
			putCallbackForSection(callbacks, component);
	}
}

export function putCallback(callbacks: ComponentData["callbacks"], component: AnyCommandComponentWithCallback): void {
	callbacks.set(
		component.customID,
		{ callback: component.callback, invokerOnly: component.invokerOnly ?? true }
	);
}

export function unlistenForInteractions(messageID: string): void {
	activeComponents.delete(messageID);
}

class ComponentContextImpl implements ComponentContext {
	private _interaction: ComponentInteraction<MessageComponentTypes, AnyTextableGuildChannel>;
	private _originalInvoker: string;
	private _responseID: string | null;
	private _acked: boolean;
	private _edited: boolean;
	private _ackPromise: Promise<void> | null;
	private _ackTimeout: NodeJS.Timeout | null;

	constructor(interaction: ComponentInteraction<MessageComponentTypes, AnyTextableGuildChannel>, originalInvoker: string) {
		this._interaction = interaction;
		this._originalInvoker = originalInvoker;
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

	get shard(): Shard { return this._interaction.guild.shard; }
	get guild(): Guild { return this._interaction.guild; }
	get user(): User { return this._interaction.user; };
	get member(): Member { return this._interaction.member; }
	get channel(): AnyTextableGuildChannel { return this._interaction.channel; }

	async respond(reply: Reply): Promise<void> {
		const messageOptions = transformReply(reply);

		if (this._responseID !== null) {
			unlistenForInteractions(this._responseID);

			await this._interaction.editFollowup(this._responseID, messageOptions).then(message => this._responseID ??= message?.id ?? null);
		} else {
			if (this._acked)
				await this._ackPromise;
			else
				this._clearTimeout();

			if (this._edited)
				this._interaction.createFollowup(messageOptions).then(response => this._responseID = response.message.id);
			else {
				await this._interaction.createMessage(messageOptions).then(
					({ callback }) => this._responseID ??= callback.resource?.message?.id ?? null
				);
			}

			this._acked = true;
		}

		if (typeof reply !== "string" && reply.components !== undefined && this._responseID !== null)
			listenForInteractions(this._responseID, this._originalInvoker, reply.components);
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

		if (typeof reply !== "string" && reply.components !== undefined)
			listenForInteractions(this._interaction.message.id, this._originalInvoker, reply.components);
	}

	_clearTimeout() {
		if (this._ackTimeout !== null) {
			clearTimeout(this._ackTimeout);
			this._ackTimeout = null;
		}
	}

	async _abandon() {
		this._clearTimeout();

		if (!this._acked)
			await this._interaction.deferUpdate();
	}
}
