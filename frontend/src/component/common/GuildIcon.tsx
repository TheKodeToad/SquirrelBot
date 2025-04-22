export function GuildIcon({ id, iconHash, size }: { id: string; iconHash: string | null; size: number; }) {
	const icon =
		iconHash !== null
			? `https://cdn.discordapp.com/icons/${id}/${iconHash}.png?size=${size * 4}`
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