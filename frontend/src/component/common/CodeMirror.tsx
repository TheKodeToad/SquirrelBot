import { StateEffect } from "@codemirror/state";
import { EditorView } from "codemirror";
import { createEffect, on, onMount } from "solid-js";

export interface CodeMirrorProps {
	value: string;
	extensions: any[];
}

export function CodeMirror(props: CodeMirrorProps) {
	let ref;

	onMount(() => {
		const view = new EditorView({
			extensions: props.extensions,
			parent: ref,
			doc: props.value,
		});

		createEffect(on(() => props.value, () => {
			view.update([
				view.state.update({
					changes: { from: 0, to: view.state.doc.length, insert: props.value }
				})
			]);
		}, { defer: true }));

		createEffect(on(() => props.extensions, () => {
			view.dispatch({
				effects: StateEffect.reconfigure.of(props.extensions)
			});
		}, { defer: true }));
	});

	return <div ref={ref}></div>;
}
