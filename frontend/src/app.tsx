import { createSignal } from "solid-js";
import { render } from "solid-js/web";
import { Button } from "./component/button";

export function App() {
	const [shown, set_shown] = createSignal(true);
	return (
		<>
			<h1>Stuff</h1>
			<Button color="secondary" onClick={() => set_shown(false)} disabled={!shown()}>
				Cancel
			</Button>
			<Button color="primary" onClick={() => set_shown(false)} disabled={!shown()}>
				OK
			</Button>
		</>
	);
}

render(App, document.getElementById("app")!);

