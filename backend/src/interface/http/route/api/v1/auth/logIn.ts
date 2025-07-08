import { CLIENT_ID, CLIENT_SECRET, REDIRECT_URI } from "#environment.ts";
import { generateToken } from "#interface/http/storage/api/tokens.ts";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { z } from "zod/v4";

interface TokenResponse {
	token_type: string;
	access_token: string;
	expires_in: number;
	refresh_token: string;
	scope: string;
}

interface UserResponse {
	id: string;
	username: string;
	avatar: string;
	discriminator: string;
	global_name: string;
}

const LogInPayload = z.strictObject({
	code: z.string(),
	codeVerifier: z.string(),
});

export default (): Hono => {
	const app = new Hono;

	app.post("/", zValidator("json", LogInPayload), async context => {
		const { code, codeVerifier } = context.req.valid("json");

		if (typeof code !== "string")
			throw new HTTPException(400, { message: "Missing code" });

		const tokenResponse = await fetch("https://discord.com/api/v10/oauth2/token", {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body: new URLSearchParams({
				client_id: CLIENT_ID,
				client_secret: CLIENT_SECRET,
				grant_type: "authorization_code",
				code,
				code_verifier: codeVerifier,
				redirect_uri: REDIRECT_URI,
				scope: "identify"
			}),
		});

		if (!tokenResponse.ok)
			throw new HTTPException(500, { message: "Failed fetching OAuth token" });

		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const tokenJSON: TokenResponse = await tokenResponse.json();
		const auth = tokenJSON.token_type + " " + tokenJSON.access_token;

		const userResponse = await fetch("https://discord.com/api/v10/users/@me", { headers: { "Authorization": auth } });

		if (userResponse.status === 401)
			throw new HTTPException(500, { message: "Application deauthorized" });

		if (!userResponse.ok)
			throw new HTTPException(500, { message: "Failed fetching Discord user" });

		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const userJSON: UserResponse = await userResponse.json();

		await fetch("https://discord.com/api/v10/oauth2/token/revoke", {
			method: "POST",
			headers: { "Content-Type": "application/x-www-form-urlencoded" },
			body: new URLSearchParams({
				client_id: CLIENT_ID,
				client_secret: CLIENT_SECRET,
				token: tokenJSON.access_token,
				token_type_hint: "access_token",
			})
		});

		const [token, expiresAt] = await generateToken(userJSON.id);

		return context.json({
			token,
			expiresAt: expiresAt.getTime(),
			username: userJSON.username,
			avatar: userJSON.avatar
		});
	});

	return app;
};
