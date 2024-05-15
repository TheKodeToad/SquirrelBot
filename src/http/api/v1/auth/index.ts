import { Router } from "express";

const router = Router();
router.use("/login", require("./login").default);
export default router;
