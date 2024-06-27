import { Router } from "express";

const router = Router();
router.get("/cases", require("./cases").default);
export default router;
