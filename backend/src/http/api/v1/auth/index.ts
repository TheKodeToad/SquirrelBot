import { Hono } from "hono";
import login from "./login";

const hono = new Hono;
hono.route("/login", login);
export default hono;
