import { UserView } from "#common/views/user.ts";
import { m, type InferView } from "mousetache";

export const MessageLogView = m.object({
	content: m.terminal({ noEscape: true }),
});
export type MessageLogView = InferView<typeof MessageLogView>;

export const MessageEditView = m.object({
	author: UserView,
	oldMessage: MessageLogView,
	newMessage: MessageLogView,
});
export type MessageEditView = InferView<typeof MessageEditView>;

export const MessageDeleteView = m.object({
	author: UserView,
	message: MessageLogView,
});
export type MessageDeleteView = InferView<typeof MessageDeleteView>;
