import { moduleLogger } from "#common/logger/index.ts";
import { ClientBase, Pool, type PoolClient } from "pg";

const logger = moduleLogger();

export async function transaction<T>(
	client: ClientBase,
	action: () => Promise<T>,
): Promise<T> {
	await client.query("BEGIN");

	try {
		const result = await action();
		await client.query("COMMIT");

		return result;
	} catch (error) {
		try {
			await client.query("ROLLBACK");
		} catch (rollbackError) {
			logger.warn?.("Error in ROLLBACK", rollbackError);
		}

		throw error;
	}
}

export async function poolTransaction<T>(
	db: Pool,
	action: (client: PoolClient) => Promise<T>,
): Promise<T> {
	const client = await db.connect();

	try {
		return await transaction(client, () => action(client));
	} finally {
		client.release();
	}
}
