import { UserView } from "#common/views/user.ts";
import { m, type InferView } from "mousetache";

export const MemberEventView = m.object({ user: UserView });
export type MemberEventView = InferView<typeof MemberEventView>;
