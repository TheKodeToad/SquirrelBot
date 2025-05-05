import { Hono } from "hono";
import { CaseType, type CaseInfo } from "../../../../../../../db/moderation/cases.ts";
import byFilter from "./byFilter.ts";
import byNumber from "./byNumber.ts";

export interface SerializedCaseObject {
	number: number;
	type: CaseType;
	createdAt: number;
	expiresAt: number | null;
	actorID: string;
	targetID: string;
	reason: string | null;
	deleteMessageSeconds: number | null;
	dmSent: boolean | null;
}

export function serializeCaseObject(info: CaseInfo): SerializedCaseObject {
	return {
		number: info.number,
		type: info.type,
		createdAt: info.createdAt.getTime(),
		expiresAt: info.expiresAt?.getTime() ?? null,
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
