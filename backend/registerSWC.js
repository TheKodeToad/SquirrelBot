import { register } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";

register("@swc-node/register/esm", pathToFileURL(path.join(import.meta.dirname, "node_modules")));
