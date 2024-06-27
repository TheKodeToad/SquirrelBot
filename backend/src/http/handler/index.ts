import { RequestHandler } from "express";

export function async_request_handler(handler: (...args: Parameters<RequestHandler>) => Promise<void>): RequestHandler {
	return async (request, response, next) => {
		try {
			await handler(request, response, next);
		} catch (error) {
			next(error);
		}
	};
}