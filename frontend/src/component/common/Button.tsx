import { IconCube } from "@tabler/icons-solidjs";
import { JSX } from "solid-js/jsx-runtime";
import { Dynamic } from "solid-js/web";

export interface ButtonProps {
	color?: "transparent" | "primary" | "secondary" | "danger" | "success";
	small?: boolean;
	icon?: typeof IconCube;
	onClick?: JSX.HTMLElementTags["button"]["onClick"];
	active?: boolean;
	disabled?: boolean;
	children?: JSX.Element;
	style?: JSX.HTMLAttributes<unknown>["style"];
}

export function Button(props: ButtonProps) {
	const classes = () => {
		let result = `button button-${props.color ?? "secondary"}`;

		if (props.small)
			result += " button-small";

		if (props.active)
			result += " button-active";

		return result;
	};

	return (
		<button class={classes()} style={props.style} onClick={props.onClick} disabled={props.disabled}>
			<span class={"button-inner"}>
				{props.icon && <Dynamic component={props.icon} size={"1em"} />}
				{props.children}
			</span>
		</button>
	);
}
