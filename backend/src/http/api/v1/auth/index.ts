import { Hono } from "hono";
import logIn from "./logIn.ts";
import logOut from "./logOut.ts";

const hono = new Hono;
hono.route("/log-in", logIn);
hono.route("/log-out", logOut);
export default hono;
