import { async_request_handler } from ".";
import { validate_token } from "../../data/api/tokens";

declare global {
	namespace Express {
		interface Request {
			discord_user_id?: string;
		}
	}
}

export const auth_middleware = async_request_handler(async (request, response, next) => {
	const { authorization } = request.headers;

	if (authorization === undefined) {
		response.sendStatus(401);
		return;
	}

	const user = await validate_token(authorization);

	if (user === null) {
		response.sendStatus(401);
		return;
	}

	request.discord_user_id = user;
	next();
});
