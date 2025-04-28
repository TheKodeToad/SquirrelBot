import { Route, Router } from "@solidjs/router";
import { render } from "solid-js/web";
import { HeaderBarComponent } from "./component/HeaderBarComponent";
import { handleLoginCallback } from "./helper/auth";
import { Guild } from "./route/guild";
import { Home } from "./route/home";
import { NotFound } from "./route/notFound";

handleLoginCallback();

export function App() {
	return (
		<Router root={HeaderBarComponent}>
			<Route path="/" component={Home} />
			<Route path="/guilds/:guildID" component={Guild} />
			<Route path="*" component={NotFound} />
		</Router>
	);
}

render(App, document.getElementById("app")!);

