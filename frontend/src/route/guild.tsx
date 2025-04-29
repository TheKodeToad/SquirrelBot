import { StreamLanguage } from "@codemirror/language";
import { toml } from "@codemirror/legacy-modes/mode/toml";
import { oneDark } from "@codemirror/theme-one-dark";
import { minimalSetup } from "codemirror";
import { CodeMirror } from "../component/common/CodeMirror";
import { LoginGate } from "../component/LoginGate";

export const Guild = () => <LoginGate><GuildComponent /></LoginGate>;

export function GuildComponent() {
	// const guildID = () => useParams().guildID!;
	const config = `
[groups.moderator]
users = ["706152404072267788"]

[prefix_commands]
prefix = "?"
reply = true

[default_permissions]
groups_command = true
help_command = true
	`;
	const extensions = [minimalSetup, oneDark, StreamLanguage.define(toml)];
	return (
		<div>
			<CodeMirror value={config} extensions={extensions} />
		</div>
	);
}
