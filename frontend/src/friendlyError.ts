export function toFriendlyError(value: unknown) {
	if (value instanceof RESTError) {
		return "Server replied: " + value.bodyMessage;
	}
}
