import type { ActionContext } from "#plugins/core/public/command.ts";
import type { ConfigStore } from "#plugins/core/public/configStore.ts";
import {
	resolvePermissions,
	type ConfigWithPermissions,
} from "#plugins/core/public/permissionResolution.ts";
import { z } from "zod";

export function permissionsGuard<C extends ConfigWithPermissions>(
	ctx: ActionContext,
	configCache: ConfigStore<z.ZodType<C>>,
	requirement?: (permissions: C["defaultPermissions"], config: C) => boolean,
): false | PermissionsGuardData<C> {
	const config = configCache.get(ctx.guild.id);

	if (config === undefined) {
		return false;
	}

	const permissions = resolvePermissions(config, ctx.member, ctx.channel);

	if (requirement !== undefined && !requirement(permissions, config)) {
		return false;
	}

	return { config, permissions };
}

interface PermissionsGuardData<C extends ConfigWithPermissions> {
	permissions: C["defaultPermissions"];
	config: C;
}
