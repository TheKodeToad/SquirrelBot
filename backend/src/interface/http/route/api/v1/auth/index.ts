import logIn from "#interface/http/route/api/v1/auth/logIn.ts";
import logOut from "#interface/http/route/api/v1/auth/logOut.ts";
import { Hono } from "hono";

const hono = new Hono;
hono.route("/log-in", logIn);
hono.route("/log-out", logOut);
export default hono;
