import { Router } from "express";
import { auth_middleware } from "../../../handler/auth";
import { guild_auth_middleware } from "../../../handler/guild_auth";

const router = Router();
router.use("/cases", require("./cases").default);
export default Router().use(
	"/:guild_id([0-9]{17,20})",
	auth_middleware,
	guild_auth_middleware,
	router
);
