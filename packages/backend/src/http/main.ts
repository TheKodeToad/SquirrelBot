import express from "express";

const app = express();
app.use("/api/v1", require("./api/v1").default);
app.use("/", express.static("../frontend/static")); // yea
app.listen(8080);
