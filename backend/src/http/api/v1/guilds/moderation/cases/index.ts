import { Hono } from "hono";
import { caseTypeID, type CaseInfo } from "../../../../../../db/moderation/cases.ts";
import byFilter from "./byFilter.ts";
import byNumber from "./byNumber.ts";

export function serializeCaseObject(info: CaseInfo) {
	return {
		number: info.number,
		type: caseTypeID(info.type),
		created_at: info.createdAt.getTime(),
		expires_at: info.expiresAt?.getTime(),
		actor_id: info.actorID,
		target_id: info.targetID,
		reason: info.reason,
		delete_message_seconds: info.deleteMessageSeconds,
		dm_sent: info.dmDelivered,
	};
}

const router = new Hono;
router.route("/", byNumber);
router.route("/", byFilter);
export default router;
