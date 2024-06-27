import { Router } from "express";

const router = Router();
router.use("/cases", require("./cases").default);
export default router;
