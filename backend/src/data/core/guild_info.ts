import { database } from "..";

export interface GuildInfo {
	id: string;
	name: string;
	icon_hash: string;
	owner_id: string;
}

export async function get_guild_info(id: string): Promise<GuildInfo | null> {
	const result = await database.query(
		`
			SELECT
				"id",
				"name",
				"icon_hash",
				"owner_id"
			FROM "core_guild_info"
			WHERE "id" = $1
		`,
		[id]
	);

	return result.rows[0] ?? null;
}

export async function get_guild_owner_id(id: string): Promise<string | null> {
	const result = await database.query(
		`
			SELECT "owner_id"
			FROM "core_guild_info"
			WHERE "id" = $1
		`,
		[id]
	);

	return result.rows[0]?.owner_id ?? null;
}

export async function get_guild_info_by_owner(owner_id: string): Promise<GuildInfo[]> {
	const result = await database.query(
		`
			SELECT
				"id",
				"name",
				"icon_hash"
			FROM "core_guild_info"
			WHERE "owner_id" = $1
		`,
		[owner_id]
	);

	return result.rows;
}

export async function delete_guild_info(id: string): Promise<void> {
	await database.query(
		`
			DELETE FROM "core_guild_info"
			WHERE "id" = $1
		`,
		[id]
	);
}

export async function upsert_guild_info(id: string, name: string, icon_hash: string | null, owner_id: string | null): Promise<void> {
	await database.query(
		`
			INSERT INTO "core_guild_info" (
				"id",
				"name",
				"icon_hash",
				"owner_id"
			)
			VALUES ($1, $2, $3, $4)
			ON CONFLICT ("id")
			DO UPDATE SET
				"name" = $2,
				"icon_hash" = $3,
				"owner_id" = $4
		`,
		[id, name, icon_hash, owner_id]
	);
}
