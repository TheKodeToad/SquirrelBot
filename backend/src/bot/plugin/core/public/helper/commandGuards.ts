import type { CommandContext } from "#bot/plugin/core/public/command.ts";
import type { ConfigStore } from "#bot/plugin/core/public/config.ts";
import { resolvePermissions, type ConfigWithPermissions } from "#bot/plugin/core/public/permissionResolution.ts";
import type { SchemaWithOutput } from "#common/types.ts";

export function permissionsGuard<C extends ConfigWithPermissions>(
	context: CommandContext,
	configCache: ConfigStore<SchemaWithOutput<C>>,
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
