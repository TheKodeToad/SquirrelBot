import express, { Router } from "express";

const router = Router();
router.use(express.json());
router.use("/auth", require("./auth").default);
router.use("/guilds", require("./guilds").default);
export default router;
