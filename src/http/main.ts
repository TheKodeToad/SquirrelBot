import express from "express";
import auth from "./auth";

const app = express();
app.use("/auth", auth);
app.listen(8080);
