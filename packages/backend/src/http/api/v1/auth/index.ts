import express from "express";

const router = express.Router();
router.use("/login", require("./login").default);
export default router;
