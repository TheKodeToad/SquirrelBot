import { createEffect, createResource, createSignal, getOwner, on, runWithOwner } from "solid-js";
import { baseExtensions } from ".";
import { getGuildConfig, writeGuildConfig } from "../../client";
import { account } from "../../state/account";
import { useGuild } from "../../state/guilds";
import { StatusFallback } from "../common/StatusFallback";
import { Button } from "../common/Button";
import { EditorView } from "codemirror";
import { IconDeviceFloppy } from "@tabler/icons-solidjs";
import { EditorState } from "@codemirror/state";

export function ConfigEditor(props: { guildID: string; plugin: string; }) {
	const guild = () => useGuild(props.guildID);

	const [resource] = createResource(() => [guild(), props.plugin], () => {
		if (guild() !== undefined)
			return getGuildConfig(account()!.token, guild()!.id, props.plugin);
		else
			return undefined;
	});

	const [saving, setSaving] = createSignal(false);
	const [dirty, setDirty] = createSignal(false);
	const saveDisabled = () => !dirty() || saving() || resource.loading || resource() === undefined;

	const owner = getOwner();

	const save = () => runWithOwner(owner, async () => {
		setSaving(true);

		const lastLine = view.state.doc.line(view.state.doc.lines).text;
		if (lastLine.length !== 0) {
			view.update([
				view.state.update({
					changes: { from: view.state.doc.length, insert: "\n" }
				})
			]);
		}

		try {
			await writeGuildConfig(
				account()!.token,
				guild()!.id,
				props.plugin,
				view.state.doc.toString()
			);
			setDirty(false);
		} finally {
			setSaving(false);
		}
	});

	const view = new EditorView();

	createEffect(on(resource, () => {
		setDirty(false);

		view.setState(EditorState.create({
			doc: resource(),
			extensions: baseExtensions({
				save: () => (save(), true),
				markDirty: () => setDirty(true)
			})
		}));
	}, { defer: true }));

	return (
		<div class="configEditor">
			<div class="hbox">
				<Button
					color={dirty() ? "success" : "secondary"}
					onClick={save}
					disabled={saveDisabled()}
					icon={IconDeviceFloppy}
				>
					{dirty() ? "Save" : "Saved"}
				</Button>
			</div>
			<StatusFallback resource={resource}>{view.dom}</StatusFallback>
		</div>
	);
}
