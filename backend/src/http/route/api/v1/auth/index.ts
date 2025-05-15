import { Hono } from "hono";
import logIn from "#http/route/api/v1/auth/logIn.ts";
import logOut from "#http/route/api/v1/auth/logOut.ts";

const hono = new Hono;
hono.route("/log-in", logIn);
hono.route("/log-out", logOut);
export default hono;
