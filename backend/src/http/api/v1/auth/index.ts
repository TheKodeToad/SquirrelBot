import { Hono } from "hono";
import log_in from "./log_in";
import log_out from "./log_out";

const hono = new Hono;
hono.route("/log_in", log_in);
hono.route("/log_out", log_out);
export default hono;
