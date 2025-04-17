export function dateToHMSString(date = new Date): string {
	return (
		date.getHours().toString().padStart(2, "0") + ":" +
		date.getMinutes().toString().padStart(2, "0") + ":" +
		date.getSeconds().toString().padStart(2, "0")
	);
}

export function dateToUnixSeconds(date: Date | number = new Date): number {
	const time = typeof date === "number" ? date : date.getTime();

	return Math.floor(time / 1000);
}
