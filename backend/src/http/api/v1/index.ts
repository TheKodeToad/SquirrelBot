import express from "express";
import PromiseRouter from "express-promise-router";

const router = PromiseRouter();
router.use(express.json());
router.use("/auth", require("./auth").default);
router.use("/guilds", require("./guilds").default);
export default router;
