import { Router } from "express";
import { CASE_TYPE_ID_TO_NAME, CaseInfo } from "../../../../../../data/moderation/cases";

export function serialise_case_object(info: CaseInfo) {
	return {
		number: info.number,
		type: CASE_TYPE_ID_TO_NAME[info.type],
		created_at: info.created_at.getTime(),
		expires_at: info.expires_at?.getTime(),
		actor_id: info.actor_id,
		target_id: info.target_id,
		reason: info.reason,
		delete_message_seconds: info.delete_message_seconds,
		dm_sent: info.dm_sent,
	};
}

const router = Router();
router.use("/", require("./by_number").default);
router.use("/", require("./by_filter").default);
export default router;
