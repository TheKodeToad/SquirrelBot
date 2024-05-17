import { createSignal } from "solid-js";
import { render } from "solid-js/web";

export function App() {

	const [count, set_count] = createSignal(0);
	return (
		<button
			onClick={event => set_count(count() + 1)}
		>
			You have pressed this button {count()} times!
		</button>
	);
}

render(App, document.getElementById("app")!);

