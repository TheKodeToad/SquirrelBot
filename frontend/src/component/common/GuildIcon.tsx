import { buildURI } from "../../common/uris";

export function GuildIcon(props: {
	id: string;
	iconHash: string | null;
	size: number;
}) {
	const icon =
		props.iconHash !== null
			? buildURI`https://cdn.discordapp.com/icons/${props.id}/${props.iconHash}.png?size=${(props.size * 4).toString()}`
			: "https://cdn.discordapp.com/embed/avatars/0.png";

	const sizePX = props.size + "px";

	return (
		<img
			class="guildIcon"
			style={{
				width: sizePX,
				height: sizePX,
				"min-width": sizePX,
				"min-height": sizePX,
			}}
			src={icon}
		/>
	);
}
