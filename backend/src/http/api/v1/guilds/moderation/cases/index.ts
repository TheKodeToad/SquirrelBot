import { Hono } from "hono";
import { caseTypeID, type CaseInfo } from "../../../../../../db/moderation/cases.ts";
import byFilter from "./by_filter.ts";
import byNumber from "./by_number.ts";

export function serializeCaseObject(info: CaseInfo) {
	return {
		number: info.number,
		type: caseTypeID(info.type),
		created_at: info.created_at.getTime(),
		expires_at: info.expires_at?.getTime(),
		actor_id: info.actor_id,
		target_id: info.target_id,
		reason: info.reason,
		delete_message_seconds: info.delete_message_seconds,
		dm_sent: info.dm_sent,
	};
}

const router = new Hono;
router.route("/", byNumber);
router.route("/", byFilter);
export default router;
