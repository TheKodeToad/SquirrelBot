import { createResource, createSignal, getOwner, runWithOwner } from "solid-js";
import { baseExtensions } from ".";
import { getGuildConfig, writeGuildConfig } from "../../client";
import { account } from "../../state/account";
import { useGuild } from "../../state/guilds";
import { CodeMirror } from "../common/CodeMirror";
import { StatusFallback } from "../common/StatusFallback";
import { Button } from "../common/Button";
import { EditorView } from "codemirror";
import { IconDeviceFloppy } from "@tabler/icons-solidjs";
import { Text } from "@codemirror/state";

export function ConfigEditor(props: { guildID: string; plugin: string; }) {
	const guild = () => useGuild(props.guildID);

	const [resource] = createResource(() => [guild(), props.plugin], () => {
		if (guild() !== undefined)
			return getGuildConfig(account()!.token, guild()!.id, props.plugin);
		else
			return undefined;
	});


	let view: EditorView;

	const [saving, setSaving] = createSignal(false);
	const saveDisabled = () => saving() || resource.loading || resource() === undefined;

	const save = async () => {
		setSaving(true);

		try {
			await writeGuildConfig(
				account()!.token,
				guild()!.id,
				props.plugin,
				view.state.doc.toString()
			);
		} finally {
			setSaving(false);
		}
	};

	const owner = getOwner();

	return (
		<div class="configEditor">
			<div class="hbox">
				<Button color="success" onClick={() => runWithOwner(owner, save)} disabled={saveDisabled()} icon={IconDeviceFloppy}>Save</Button>
			</div>
			<StatusFallback resource={resource}>
				<CodeMirror
					value={resource()!}
					viewRef={v => view = v}
					extensions={baseExtensions(() => (runWithOwner(owner, save), true))}
				/>
			</StatusFallback>
		</div>
	);
}
