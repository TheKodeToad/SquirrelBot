import { Route, Router } from "@solidjs/router";
import { render } from "solid-js/web";
import { HeaderBarComponent } from "./component/HeaderBarComponent";
import { Home } from "./route/home";
import { NotFound } from "./route/notFound";

export function App() {
	return (
		<Router root={HeaderBarComponent}>
			<Route path="/" component={Home} />
			<Route path="/guilds/:guildID" component={Home} />
			<Route path="*" component={NotFound} />
		</Router>
	);
}

render(App, document.getElementById("app")!);

