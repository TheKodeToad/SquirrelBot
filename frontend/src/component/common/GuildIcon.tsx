import { buildURI } from "../../common/uri";

export function GuildIcon({ id, iconHash, size }: { id: string; iconHash: string | null; size: number; }) {
	const icon =
		iconHash !== null
			? buildURI`https://cdn.discordapp.com/icons/${id}/${iconHash}.png?size=${(size * 4).toString()}`
			: "https://cdn.discordapp.com/embed/avatars/0.png";

	const sizePX = size + "px";

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
