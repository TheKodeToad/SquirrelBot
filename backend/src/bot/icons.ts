const _icons = {
	success: "\u2705", // :white_check_mark:
	error: "\u274C", // :x:
	warning: "\u26A0\uFE0F", // :warning:,
};

export const icons: typeof _icons = Object.setPrototypeOf(_icons, null);
