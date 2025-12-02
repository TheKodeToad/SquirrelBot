import { definePlugin } from "#plugin.ts";
import { ConfigStore } from "#plugins/core/public/configStore.ts";
import { defineConfig } from "#plugins/core/public/extensionPoints.ts";
import tag from "#plugins/tags/command/tag.ts";
import tagCreate from "#plugins/tags/command/tagCreate.ts";
import tagDelete from "#plugins/tags/command/tagDelete.ts";
import tagEdit from "#plugins/tags/command/tagEdit.ts";
import { TagsConfig } from "#plugins/tags/config.ts";

export const tagsConfigStore = new ConfigStore(TagsConfig);

const defaultConfig = `enabled = false

# Example: allow admins to create tags
# [[permission_overrides]]
# in_group = ["admin"]
# tag_create = true
# tag_edit = true
# tag_delete = true`;

export default definePlugin({
	id: "tags",
	name: "Tags",
	description: "Create and send preset messages.",

	contributions: [
		defineConfig({
			store: tagsConfigStore,
			defaultValue: defaultConfig,
		}),
		tag,
		tagCreate,
		tagEdit,
		tagDelete,
	],
});
