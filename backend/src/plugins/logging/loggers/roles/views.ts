import { RoleView } from "#common/views/role.ts";
import { UserView } from "#common/views/user.ts";
import { m, type InferView } from "mousetache";

export const RoleCreateView = m.object({
	actor: UserView,
	role: RoleView,
});
export type RoleCreateView = InferView<typeof RoleCreateView>;

export const RoleUpdateView = m.object({
	actor: UserView,
	oldRole: RoleView,
	newRole: RoleView,
	nameChanged: m.terminal(),
	colorChanged: m.terminal(),
	hoistedChanged: m.terminal(),
	mentionableChanged: m.terminal(),
});
export type RoleUpdateView = InferView<typeof RoleUpdateView>;

export const RoleDeleteView = m.object({
	actor: UserView,
	role: RoleView,
});
export type RoleDeleteView = InferView<typeof RoleDeleteView>;
