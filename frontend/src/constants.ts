const constants: Constants = JSON.parse(document.getElementById("constants")!.textContent!);

interface Constants {
	env: {
		CLIENT_ID: string;
		REDIRECT_URI: string;

		APP_NAME: string;
		APP_DESCRIPTION: string;
		APP_SOURCE_CODE: string;
		APP_LIBRARIES_LINK: string;
		APP_INVITE_PERMISSIONS: string;
	};
	plugins: Plugin[];
}

export interface Plugin {
	id: string;
	name: string;
	description?: string;
}

export const { CLIENT_ID, REDIRECT_URI, APP_NAME, APP_DESCRIPTION, APP_SOURCE_CODE, APP_INVITE_PERMISSIONS } = constants.env;
export const PLUGINS = constants.plugins;
