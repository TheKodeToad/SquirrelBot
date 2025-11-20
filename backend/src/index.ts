import { moduleLogger } from "#common/logger/index.ts";
import type { Plugin } from "#plugin.ts";
import { checkMigrationsOrExit } from "#storage/migration.ts";
import { type NotifDispatcher, connectNotifDispatcher } from "#storage/notification.ts";
import { readdir } from "node:fs/promises";
import path from "node:path";
import { Pool } from "pg";

export interface SquirrelContext {
	plugins: Map<string, Plugin>;
	db: Pool;
	dbNotifs: NotifDispatcher;
}

const logger = moduleLogger();

export async function squirrelInit(): Promise<SquirrelContext> {
	preInit();

	const db = new Pool;

	const client = await db.connect();
	try {
		await checkMigrationsOrExit(client);
	} finally {
		client.release();
	}

	const plugins = await loadPlugins();

	logger.info?.(
		`Plugins (${plugins.size}):`,
		[...plugins.keys()].map(id => "- " + id).join("\n")
	);

	logger.info?.("Connecting Postgres notification dispatcher");
	const dbNotifs = await connectNotifDispatcher(db);

	return {
		plugins,
		db,
		dbNotifs,
	};
}

export async function squirrelShutdown(ctx: SquirrelContext) {
	ctx.db.end();
	ctx.dbNotifs.disconnect();
}

function preInit() {
	// not sure if this is good practice but we certainly don't want a crash because we forgot await
	process.on("unhandledRejection", error => {
		logger.error?.("Unhandled Promise rejection!", error);
	});

	if (hasProto())
		logger.warn?.("The app is tested with --disable-proto=throw. Running without this option is unnecessary and not recommended!");

	Object.freeze(Object.prototype);
	Object.freeze(Array.prototype);
}

function hasProto(): boolean {
	const foo = {};
	try {
		// @ts-expect-error deliberate access of legacy prop
		return foo.__proto__ != null;
	} catch {
		return false;
	}
}

async function loadPlugins(): Promise<Map<string, Plugin>> {
	const result: Map<string, Plugin> = new Map;

	const pluginDir = path.join(import.meta.dirname, "plugin");
	const entries = await readdir(pluginDir, { withFileTypes: true });

	entries.sort((a, b) => a.name.localeCompare(b.name, "en-US"));

	for (const entry of entries) {
		if (!entry.isDirectory())
			continue;

		const index = path.join(entry.parentPath, entry.name, "index.ts");
		const { default: plugin } = await import(index) as { default: Plugin; };

		initPlugin(plugin);

		if (result.has(plugin.id))
			throw new Error(`Duplicate plugin #${plugin.id}`);

		result.set(plugin.id, plugin);
	}

	if (result.size === 0)
		throw new Error("No plugins loaded - something must be wrong!");

	return result;
}

function initPlugin(plugin: Plugin): void {
	if (plugin.contributions !== undefined)
		for (const contribution of plugin.contributions)
			contribution(plugin);
}
