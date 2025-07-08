import type { CommandContext } from "#plugin/core/discord/public/command.ts";
import type { ConfigStore } from "#plugin/core/discord/public/configStore.ts";
import { resolvePermissions, type ConfigWithPermissions } from "#plugin/core/discord/public/permissionResolution.ts";
import { z } from "zod/v4";

export function permissionsGuard<C extends ConfigWithPermissions>(
	context: CommandContext,
	configCache: ConfigStore<z.ZodType<C>>,
	requirement?: (permissions: C["default_permissions"], config: C) => boolean
): false | PermissionsGuardData<C> {
	const config = configCache.get(context.guild.id);

	if (config === undefined)
		return false;

	const permissions = resolvePermissions(config, context.member, context.channel);

	if (requirement !== undefined && !requirement(permissions, config))
		return false;

	return { config, permissions };
}

interface PermissionsGuardData<C extends ConfigWithPermissions> {
	permissions: C["default_permissions"];
	config: C;
}
