import express from "express";

const router = express.Router();
router.use("/login", require("./login").default);
router.use("/token", require("./token").default);
export default router;
