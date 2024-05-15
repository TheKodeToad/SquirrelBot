import express from "express";

const app = express();
app.use("/api/v1", require("./api/v1").default);
app.listen(8080);
