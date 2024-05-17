import crypto from "crypto";
import express from "express";
import { CLIENT_ID, CLIENT_SECRET, REDIRECT_URI } from "../../../../config";

const TOKEN_EPOCH = new Date(2024, 0, 1).getTime();

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

const router = express.Router();
router.use(express.json());
router.post("/", async (request, response) => {
	const { code } = request.body;

	if (typeof code !== "string") {
		response.status(400).send("Missing code");
		return;
	}
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
		return; // TODO

	const token_json: TokenResponse = await token_response.json();
	const auth = token_json.token_type + " " + token_json.access_token;

	const user_response = await fetch("https://discord.com/api/v10/users/@me", { headers: { "Authorization": auth } });

	if (user_response.status === 401) {
		response.status(500).send("Application deauthorized");
		return;
	}

	if (!user_response.ok)
		return;

	const user_json: UserResponse = await user_response.json();

	const revoke_response = await fetch("https://discord.com/api/v10/oauth2/token/revoke", {
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

	if (!revoke_response.ok)
		return;

	const token_id = BigInt(user_json.id).toString(16);
	const token_timestamp = (Date.now() - TOKEN_EPOCH).toString(16);
	const token_secret = crypto.randomBytes(16).toString("hex");

	response.send(`${token_id}.${token_timestamp}.${token_secret}`);
});
export default router;
