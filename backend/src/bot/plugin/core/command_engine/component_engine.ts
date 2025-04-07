import { ComponentInteraction, MessageFlags, type AnyTextableGuildChannel, type MessageComponentTypes } from "oceanic.js";
import { TTLMap } from "../../../../common/ttl_map.ts";
import type { Component, ComponentCallback, ComponentContext, Reply } from "../public/command/index.ts";
import { define_event_listener } from "../public/event_listener.ts";
import { AUTO_DEFER_AFTER, STATE_CLEANUP_INTERVAL, STATE_EXPIRE_AFTER, transform_reply } from "./index.ts";

interface ComponentData {
	callbacks: Map<string, Required<ComponentCallback>>;
	invoker_id: string;
}

const active_components: TTLMap<string, ComponentData> = new TTLMap(STATE_EXPIRE_AFTER);
setInterval(() => active_components.cleanup(), STATE_CLEANUP_INTERVAL);

export const component_interaction_handler = define_event_listener("interactionCreate", async interaction => {
	if (!interaction.inCachedGuildChannel())
		return;

	if (!interaction.isComponentInteraction())
		return;

	const component_data = active_components.get(interaction.message.id);

	if (component_data === undefined)
		return;

	const callback = component_data.callbacks.get(interaction.data.customID);

	if (callback === undefined)
		return;

	if (callback.invoker_only && interaction.user.id !== component_data.invoker_id) {
		// just ignore
		interaction.deferUpdate();
		return;
	}

	const context = new ComponentContextImpl(interaction, component_data.invoker_id);

	try {
		await callback.callback(context);
	} catch (error) {
		await interaction.createFollowup({
			content: ":boom: Something went wrong while processing your action",
			flags: MessageFlags.EPHEMERAL
		});
		// HACK for now
		context["_acked"] = true;
		throw error;
	} finally {
		await context._abandon();
	}
});

export function listen_for_interactions(message_id: string, invoker_id: string, components: Component[][]): void {
	const callbacks: ComponentData["callbacks"] = new Map;

	for (const row of components) {
		for (const component of row) {
			if (!("callback" in component))
				continue;

			if (component.disabled)
				continue;

			const { customID, callback, invoker_only } = component;
			callbacks.set(customID, { callback, invoker_only: invoker_only ?? true });
		}
	}

	active_components.set(message_id, { callbacks, invoker_id });
}

export function unlisten_for_interactions(message_id: string): void {
	active_components.delete(message_id);
}

class ComponentContextImpl implements ComponentContext {
	private _interaction: ComponentInteraction<MessageComponentTypes, AnyTextableGuildChannel>;
	private _original_invoker: string;
	private _acked: boolean;
	private _ack_promise: Promise<void> | null;
	private _ack_timeout: NodeJS.Timeout | null;

	constructor(interaction: ComponentInteraction<MessageComponentTypes, AnyTextableGuildChannel>, original_invoker: string) {
		this._interaction = interaction;
		this._original_invoker = original_invoker;
		this._acked = false;
		this._ack_timeout = setTimeout(() => {
			this._ack_timeout = null;
			this._acked = true;
			this._ack_promise = interaction.deferUpdate().then(() => { });
		}, Math.max(0, AUTO_DEFER_AFTER - (Date.now() - interaction.createdAt.getTime()))).unref();
		this._ack_promise = null;
	}

	async edit(reply: Reply): Promise<void> {
		const message_options = transform_reply(reply);

		unlisten_for_interactions(this._interaction.message.id);

		if (this._acked) {
			if (this._ack_promise !== null)
				await this._ack_promise;

			await this._interaction.message.edit(message_options);
		} else {
			this._remove_timeout();
			await this._interaction.editParent(message_options);
			this._acked = true;
		}

		if (typeof reply !== "string" && reply.components !== undefined)
			listen_for_interactions(this._interaction.message.id, this._original_invoker, reply.components);
	}

	_remove_timeout() {
		if (this._ack_timeout !== null) {
			clearTimeout(this._ack_timeout);
			this._ack_timeout = null;
		}
	}

	async _abandon() {
		this._remove_timeout();

		if (!this._acked)
			await this._interaction.deferUpdate();
	}
}
