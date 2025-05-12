import { ButtonStyles, ComponentTypes, type ContainerComponent, type MediaGalleryComponent, type MediaGalleryItem, type SeparatorComponent, type TextDisplayComponent, type ThumbnailComponent, type URLButton } from "oceanic.js";
import type { CommandActionRow, CommandContainerComponent, CommandSectionComponent } from "../public/command.ts";

// inspired by nin0-dev's implementation

export function Text(content: string = ""): TextDisplayComponent {
	return { content, type: ComponentTypes.TEXT_DISPLAY };
}

export function Separator(props: Omit<SeparatorComponent, "type"> = {}): SeparatorComponent {
	return { ...props, type: ComponentTypes.SEPARATOR };
}

export function Thumbnail(url: string, props: Omit<ThumbnailComponent, "type" | "media"> = {}): ThumbnailComponent {
	return { ...props, media: { url }, type: ComponentTypes.THUMBNAIL };
}

export function Section(items: TextDisplayComponent[] = [], accessory: CommandSectionComponent["accessory"]): CommandSectionComponent {
	return { components: items, accessory, type: ComponentTypes.SECTION };
}

export function GalleryItem(url: string, props: Omit<MediaGalleryItem, "media"> = {}): MediaGalleryItem {
	return { ...props, media: { url } };
}

export function Gallery(items: MediaGalleryItem[] = []): MediaGalleryComponent {
	return { items, type: ComponentTypes.MEDIA_GALLERY };
}

export function Container(items: CommandContainerComponent["components"] = [], props: Omit<ContainerComponent, "type" | "components"> = {}): CommandContainerComponent {
	return { ...props, components: items, type: ComponentTypes.CONTAINER };
}

export function ActionRow(items: CommandActionRow["components"] = []): CommandActionRow {
	return { components: items, type: ComponentTypes.ACTION_ROW };
}

export function LinkButton(label: string, url: string, props: Omit<URLButton, "type" | "label" | "url" | "style"> = {}): URLButton {
	return { ...props, label, url, style: ButtonStyles.LINK, type: ComponentTypes.BUTTON };
}
