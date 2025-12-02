import {
	MAX_AUTOCOMPLETE_CHOICES,
	type AutocompleteContext,
} from "#plugins/core/public/command.ts";
import { tagsTable } from "#plugins/tags/storage/tags.ts";

export async function autocompleteTags(
	ctx: AutocompleteContext,
	value: string,
): Promise<string[]> {
	return await tagsTable.queryNames(ctx.backendCtx.db, ctx.guild.id, {
		name: value,
		limit: MAX_AUTOCOMPLETE_CHOICES,
	});
}
