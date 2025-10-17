import { StateEffect } from "@codemirror/state";
import { EditorView } from "codemirror";
import { createEffect, on } from "solid-js";

export interface CodeMirrorProps {
	value: string;
	extensions: any[];
	viewRef?: (view: EditorView) => void;
}

export function CodeMirror(props: CodeMirrorProps) {
	const view = new EditorView({
		extensions: props.extensions,
		doc: props.value,
	});

	props.viewRef?.(view);

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

	return view.dom;
}
