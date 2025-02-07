import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { HTTPException } from "hono/http-exception";
import { validator } from "hono/validator";
import { generate_token } from "../../../../db/api/tokens";
import { CLIENT_ID, CLIENT_SECRET, REDIRECT_URI } from "../../../../environment";

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

interface ErrorResponse {
	error: string;
	error_description: string;
}

const router = new Hono;
router.post("/", bodyLimit({ maxSize: 64 }), validator("json", value => value), async context => {
	const { code } = context.req.valid("json");

	if (typeof code !== "string")
		throw new HTTPException(400, { message: "Missing code" });

	const token_response = await fetch("https://discord.com/api/v10/oauth2/token", {
		method: "POST",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
		},
		body: new URLSearchParams({
			client_id: CLIENT_ID,
			client_secret: CLIENT_SECRET,
			grant_type: "authorization_code",
			code,
			redirect_uri: REDIRECT_URI,
			scope: "identify"
		}),
	});

	if (!token_response.ok)
		throw new HTTPException(500, { message: "Failed fetching OAuth token" });

	const token_json: TokenResponse = await token_response.json();
	const auth = token_json.token_type + " " + token_json.access_token;

	const user_response = await fetch("https://discord.com/api/v10/users/@me", { headers: { "Authorization": auth } });

	if (user_response.status === 401)
		throw new HTTPException(500, { message: "Application deauthorized" });

	if (!user_response.ok)
		throw new HTTPException(500, { message: "Failed fetching Discord user" });

	const user_json: UserResponse = await user_response.json();

	await fetch("https://discord.com/api/v10/oauth2/token/revoke", {
		method: "POST",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
		},
		body: new URLSearchParams({
			client_id: CLIENT_ID,
			client_secret: CLIENT_SECRET,
			token: token_json.access_token,
			token_type_hint: "access_token",
		})
	});

	const [token, expires_at] = await generate_token(user_json.id);
	return context.json({ token, expires_at: expires_at.getTime() });
});
export default router;
