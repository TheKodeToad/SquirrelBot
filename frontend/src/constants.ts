const constants: Constants = JSON.parse(document.getElementById("constants")!.textContent!);

interface Constants {
	CLIENT_ID: string;
	REDIRECT_URI: string;

	APP_NAME: string;
	APP_DESCRIPTION: string;
	APP_SOURCE_CODE: string;
	APP_LIBRARIES_LINK: string;
	APP_INVITE_PERMISSIONS: string;
}

export const { CLIENT_ID, REDIRECT_URI, APP_NAME, APP_DESCRIPTION, APP_SOURCE_CODE, APP_INVITE_PERMISSIONS } = constants;
