import type { SchemaWithOutput } from "../../../../../common/types.ts";
import type { ConfigCache } from "../config.ts";
import { resolve_permissions, type ConfigWithPermissions } from "../permission_resolution.ts";
import type { CommandContext } from "./index.ts";

export function permissions_guard<C extends ConfigWithPermissions>(
	context: CommandContext,
	config_cache: ConfigCache<SchemaWithOutput<C>>,
	requirement?: (permissions: C["default_permissions"], config: C) => boolean
): false | PermissionsGuardData<C> {
	const config = config_cache.get(context.guild.id);

	if (config === undefined)
		return false;

	const permissions = resolve_permissions(config, context.member, context.channel);

	if (requirement !== undefined && !requirement(permissions, config))
		return false;

	return { config, permissions };
}

interface PermissionsGuardData<C extends ConfigWithPermissions> {
	permissions: C["default_permissions"];
	config: C;
}
