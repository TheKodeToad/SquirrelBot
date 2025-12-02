export interface Tag {
	name: string;
	content: string;
	attachments: readonly string[];
	/** The tag's color (-1 for transparent) */
	color: number;
}
