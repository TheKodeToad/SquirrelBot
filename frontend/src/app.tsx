import { Route, Router } from "@solidjs/router";
import { render } from "solid-js/web";
import { handleLoginCallback } from "./auth";
import { HeaderBarComponent } from "./component/HeaderBarComponent";
import { GuildRoutes } from "./route/guild";
import { Home } from "./route/home";
import { NotFound } from "./route/notFound";

handleLoginCallback();

export function App() {
	return (
		<Router root={HeaderBarComponent}>
			<Route path="/" component={Home} />
			<Route path="/guilds/:guildID">
				<GuildRoutes />
			</Route>
			<Route path="*" component={NotFound} />
		</Router>
	);
}

render(App, document.getElementById("app")!);

