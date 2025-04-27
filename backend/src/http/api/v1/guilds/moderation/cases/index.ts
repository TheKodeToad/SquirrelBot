import { Hono } from "hono";
import { caseTypeID, type CaseInfo } from "../../../../../../db/moderation/cases.ts";
import byFilter from "./byFilter.ts";
import byNumber from "./byNumber.ts";

// TODO Just don't bother =)
export function serializeCaseObject(info: CaseInfo) {
	return {
		number: info.number,
		type: caseTypeID(info.type),
		createdAt: info.createdAt.getTime(),
		expiresAt: info.expiresAt?.getTime(),
		actorID: info.actorID,
		targetID: info.targetID,
		reason: info.reason,
		deleteMessageSeconds: info.deleteMessageSeconds,
		dmSent: info.dmDelivered,
	};
}

const router = new Hono;
router.route("/", byNumber);
router.route("/", byFilter);
export default router;
