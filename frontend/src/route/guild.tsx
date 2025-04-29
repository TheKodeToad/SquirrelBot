import { oneDark } from "@codemirror/theme-one-dark";
import { basicSetup } from "codemirror";
import { tomlHighlighting as tomlLanguage } from "../codemirror/toml";
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
	const extensions = [basicSetup, oneDark, tomlLanguage];
	return (
		<div>
			<CodeMirror value={config} extensions={extensions} />
		</div>
	);
}
