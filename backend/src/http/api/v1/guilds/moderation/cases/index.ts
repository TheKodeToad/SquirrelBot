import { Hono } from "hono";
import { case_type_id, type CaseInfo } from "../../../../../../db/moderation/cases.ts";
import by_filter from "./by_filter.ts";
import by_number from "./by_number.ts";

export function serialise_case_object(info: CaseInfo) {
	return {
		number: info.number,
		type: case_type_id(info.type),
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
router.route("/", by_number);
router.route("/", by_filter);
export default router;
