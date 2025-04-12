import { Hono } from "hono";
import logIn from "./log_in.ts";
import logOut from "./log_out.ts";

const hono = new Hono;
hono.route("/log-in", logIn);
hono.route("/log-out", logOut);
export default hono;
