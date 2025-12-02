import { Permissions } from "oceanic.js";

export const APP_NAME = "SquirrelBot";
export const APP_DESCRIPTION =
	"Advanced moderation and management bot created by TheKodeToad.\n"
	+ "Made in England with Oceanic.js and love!";
export const APP_SOURCE_CODE = "https://github.com/TheKodeToad/SquirrelBot";
export const APP_LIBRARIES_LINK =
	"https://github.com/TheKodeToad/SquirrelBot/blob/develop/backend/package.json";
export const APP_INVITE_PERMISSIONS =
	Permissions.VIEW_AUDIT_LOG
	| Permissions.KICK_MEMBERS
	| Permissions.BAN_MEMBERS
	| Permissions.MANAGE_WEBHOOKS
	| Permissions.VIEW_CHANNEL
	| Permissions.MODERATE_MEMBERS
	| Permissions.SEND_MESSAGES
	| Permissions.SEND_MESSAGES_IN_THREADS
	| Permissions.MANAGE_MESSAGES
	| Permissions.EMBED_LINKS
	| Permissions.READ_MESSAGE_HISTORY
	| Permissions.MUTE_MEMBERS
	| Permissions.DEAFEN_MEMBERS;
