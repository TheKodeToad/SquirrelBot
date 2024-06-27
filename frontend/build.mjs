import * as esbuild from "esbuild";
import { solidPlugin } from "esbuild-plugin-solid";

if (process.argv.length > 3 || (process.argv.length === 3 && process.argv[2] !== "watch")) {
	console.error("Usage: node build.mjs or node build.mjs watch");
	process.exit(1);
}

const watch = process.argv.length === 3;

const context = await esbuild.context({
	entryPoints: ["src/app.tsx"],
	outfile: "static/app.js",
	bundle: true,
	treeShaking: true,
	minify: true,
	plugins: [solidPlugin()],
	logLevel: "info",
});

if (watch)
	await context.watch();
else {
	await context.rebuild();
	await context.dispose();
}
