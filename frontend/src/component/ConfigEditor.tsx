import { indentLess, insertTab } from "@codemirror/commands";
import { indentUnit, syntaxTree } from "@codemirror/language";
import { EditorState } from "@codemirror/state";
import { Command, keymap } from "@codemirror/view";
import { gruvboxDark } from "@fsegurai/codemirror-theme-gruvbox-dark";
import { IconDeviceFloppy } from "@tabler/icons-solidjs";
import { basicSetup, EditorView } from "codemirror";
import { createEffect, createResource, createSignal, getOwner, on, runWithOwner } from "solid-js";
import { getGuildConfig, writeGuildConfig } from "../client";
import { toml } from "../codemirror/toml";
import { account } from "../state/account";
import { useGuild } from "../state/guilds";
import { Button } from "./common/Button";
import { StatusFallback } from "./common/StatusFallback";

function baseExtensions(options: {
	save: Command,
	markDirty: () => void,
}) {
	return [
		basicSetup,
		toml(),
		keymap.of([{
			key: "Tab",
			run: insertTab,
			shift: indentLess,
		}]),
		keymap.of([{
			key: "Mod-s",
			run: options.save,
		}]),
		indentUnit.of("\t"),
		gruvboxDark,
		EditorView.theme({
			"&.cm-focused": {
				outline: "none",
				"box-shadow": "none !important", // HACK
			}
		}),
		EditorView.updateListener.of(update => {
			if (update.docChanged)
				options.markDirty();
		}),
	];
}

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
		(window as any).dumpTree = () => {
			const tree = syntaxTree(view.state);
			tree.iterate({
				enter: node => {
					console.group(node.type.name);
					console.log(view.state.doc.slice(node.from, node.to).toString());
					return true;
				},
				leave: () => {
					console.groupEnd();
					return false;
				}
			});
		};
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
