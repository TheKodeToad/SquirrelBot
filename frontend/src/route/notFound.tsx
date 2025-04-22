import { A } from "@solidjs/router";
import { IconArrowLeft, IconHome } from "@tabler/icons-solidjs";
import { Button } from "../component/common/Button";

export function NotFound() {
	return (
		<div class="vbox notFound">
			<h1 style={{ margin: 0 }}>Page Not Found</h1>
			<p>Are you lost?</p>
			<div class="hbox">
				<Button onClick={() => history.back()} color="primary" icon={IconArrowLeft}>Take me back</Button>
				<A href="/"><Button icon={IconHome}>Take me home</Button></A>
			</div>
		</div>
	);
}