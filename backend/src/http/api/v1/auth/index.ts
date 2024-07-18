import PromiseRouter from "express-promise-router";

const router = PromiseRouter();
router.use("/login", require("./login").default);
export default router;
