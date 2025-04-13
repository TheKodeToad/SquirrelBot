import type { SchemaWithOutput } from "../../../../../common/types.ts";
import type { ConfigCache } from "../config.ts";
import { resolvePermissions, type ConfigWithPermissions } from "../permissionResolution.ts";
import type { CommandContext } from "./index.ts";

export function permissionsGuard<C extends ConfigWithPermissions>(
	context: CommandContext,
	configCache: ConfigCache<SchemaWithOutput<C>>,
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
