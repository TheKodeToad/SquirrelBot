import {
	MAX_AUTOCOMPLETE_CHOICES,
	type AutocompleteContext,
} from "#plugin/core/public/command.ts";
import { searchTagNames } from "#plugin/tags/storage/tags.ts";

export async function autocompleteTags(
	ctx: AutocompleteContext,
	value: string,
): Promise<string[]> {
	return await searchTagNames(ctx.squirrelCtx.db, ctx.guild.id, {
		name: value,
		limit: MAX_AUTOCOMPLETE_CHOICES,
	});
}
