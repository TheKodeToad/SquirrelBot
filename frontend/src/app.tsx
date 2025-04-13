import { Route, Router } from "@solidjs/router";
import { render } from "solid-js/web";
import { HeaderBarComponent } from "./component/HeaderBarComponent";
import { NotFound } from "./route/notFound";
import { Servers } from "./route/servers";

export function App() {
	return (
		<Router root={HeaderBarComponent}>
			<Route path="/" component={Servers} />
			<Route path="*" component={NotFound} />
		</Router>
	);
}

render(App, document.getElementById("app")!);

