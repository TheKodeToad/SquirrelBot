import PromiseRouter from "express-promise-router";

const router = PromiseRouter();
router.use("/cases", require("./cases").default);
export default router;
