import { ComponentInteraction, MessageFlags, type AnyTextableGuildChannel, type MessageComponentTypes } from "oceanic.js";
import { TTLMap } from "../../../../../common/ttlMap.ts";
import type { Component, ComponentCallback, ComponentContext, Reply } from "../../public/command.ts";
import { defineEventListener } from "../../public/eventListener.ts";
import { AUTO_DEFER_AFTER, STATE_CLEANUP_INTERVAL, STATE_EXPIRE_AFTER, transformReply } from "../index.ts";

interface ComponentData {
	callbacks: Map<string, Required<ComponentCallback>>;
	invokerID: string;
}

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
		await callback.callback(context);
	} catch (error) {
		await interaction.createFollowup({
			content: ":boom: Something went wrong while processing your action",
			flags: MessageFlags.EPHEMERAL
		});
		// HACK for now
		context._acked = true;
		throw error;
	} finally {
		await context._abandon();
	}
});

export function listenForInteractions(messageID: string, invokerID: string, components: Component[][]): void {
	const callbacks: ComponentData["callbacks"] = new Map;

	for (const row of components) {
		for (const component of row) {
			if (!("callback" in component))
				continue;

			if (component.disabled)
				continue;

			const { customID, callback, invokerOnly } = component;
			callbacks.set(customID, { callback, invokerOnly: invokerOnly ?? true });
		}
	}

	activeComponents.set(messageID, { callbacks, invokerID: invokerID });
}

export function unlistenForInteractions(messageID: string): void {
	activeComponents.delete(messageID);
}

class ComponentContextImpl implements ComponentContext {
	private _interaction: ComponentInteraction<MessageComponentTypes, AnyTextableGuildChannel>;
	private _originalInvoker: string;
	_acked: boolean;
	private _ackPromise: Promise<void> | null;
	private _ackTimeout: NodeJS.Timeout | null;

	constructor(interaction: ComponentInteraction<MessageComponentTypes, AnyTextableGuildChannel>, originalInvoker: string) {
		this._interaction = interaction;
		this._originalInvoker = originalInvoker;
		this._acked = false;
		this._ackTimeout = setTimeout(() => {
			this._ackTimeout = null;
			this._acked = true;
			this._ackPromise = interaction.deferUpdate().then(() => { });
		}, Math.max(0, AUTO_DEFER_AFTER - (Date.now() - interaction.createdAt.getTime()))).unref();
		this._ackPromise = null;
	}

	async edit(reply: Reply): Promise<void> {
		const messageOptions = transformReply(reply);

		unlistenForInteractions(this._interaction.message.id);

		if (this._acked) {
			if (this._ackPromise !== null)
				await this._ackPromise;

			await this._interaction.message.edit(messageOptions);
		} else {
			this._removeTimeout();
			await this._interaction.editParent(messageOptions);
			this._acked = true;
		}

		if (typeof reply !== "string" && reply.components !== undefined)
			listenForInteractions(this._interaction.message.id, this._originalInvoker, reply.components);
	}

	_removeTimeout() {
		if (this._ackTimeout !== null) {
			clearTimeout(this._ackTimeout);
			this._ackTimeout = null;
		}
	}

	async _abandon() {
		this._removeTimeout();

		if (!this._acked)
			await this._interaction.deferUpdate();
	}
}
