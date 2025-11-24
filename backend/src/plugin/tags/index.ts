import { definePlugin } from "#plugin.ts";
import { ConfigStore } from "#plugin/core/public/configStore.ts";
import { defineConfig } from "#plugin/core/public/extensionPoints.ts";
import tag from "#plugin/tags/command/tag.ts";
import tagDelete from "#plugin/tags/command/tagDelete.ts";
import tagSet from "#plugin/tags/command/tagSet.ts";
import { TagsConfig } from "#plugin/tags/config.ts";

export const tagsConfigStore = new ConfigStore(TagsConfig);

export const MAX_TAG_NAME_LENGTH = 30;
export const MAX_TAG_CONTENT_LENGTH = 4000;

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
		tagSet,
		tagDelete,
	],
});
