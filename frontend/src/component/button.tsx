import { JSX } from "solid-js/jsx-runtime";

export interface ButtonProps {
	color?: "transparent" | "primary" | "secondary" | "danger" | "success";
	onClick?: JSX.HTMLElementTags["button"]["onClick"];
	children?: JSX.Element;
	disabled?: boolean;
}

export function Button(props: ButtonProps) {
	return (
		<button class={`button button-${props.color ?? "secondary"}`} onClick={props.onClick} disabled={props.disabled}>
			{props.children}
		</button>
	);
}