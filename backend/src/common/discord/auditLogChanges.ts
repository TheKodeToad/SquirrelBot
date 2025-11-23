import type { AuditLogChange, Permission } from "oceanic.js";

export interface AuditLogUpdate<T> {
	old?: T;
	new?: T;
}

export type AuditLogUpdates = Partial<Record<string, AuditLogUpdate<unknown>>>;

export interface RoleUpdates {
	name?: AuditLogUpdate<string>;
	permissions?: AuditLogUpdate<Permission>;
	color?: AuditLogUpdate<number>;
	hoist: AuditLogUpdate<boolean>;
	mentionable?: AuditLogUpdate<boolean>;
}

export function parseUpdates(changes: AuditLogChange[]): AuditLogUpdates {
	// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
	const result: AuditLogUpdates = Object.create(null);

	for (const change of changes) {
		result[change.key] = {
			old: "old_value" in change ? change.old_value : undefined,
			new: change.new_value,
		};
	}

	return result;
}

export function parseRoleUpdates(changes: AuditLogChange[]): RoleUpdates {
	return parseUpdates(changes) as unknown as RoleUpdates;
}
