import * as esbuild from "esbuild";
import fs from "fs";
import path from "path";

async function find(dir, filter, out = []) {
	for (const name of fs.readdirSync(dir)) {
		const file = path.join(dir, name);

		if (fs.statSync(file).isDirectory())
			await find(file, filter, out);
		else if (!filter || filter(file))
			out.push(file);
	}

	return out;
}

await esbuild.build({
	entryPoints: await find("src", file => file.endsWith(".ts")),
	platform: "node",
	format: "cjs",
	outdir: "out",
	logLevel: "warning",
});
