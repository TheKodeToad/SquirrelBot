import { ButtonStyles, ComponentTypes, type ContainerComponent, type MediaGalleryComponent, type MediaGalleryItem, type MessageActionRow, type MessageActionRowComponent, type SectionComponent, type SeparatorComponent, type TextDisplayComponent, type ThumbnailComponent, type URLButton } from "oceanic.js";

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

export function Section(items: TextDisplayComponent[] = [], accessory: SectionComponent["accessory"]): SectionComponent {
	return { components: items, accessory, type: ComponentTypes.SECTION };
}

export function GalleryItem(url: string, props: Omit<MediaGalleryItem, "media"> = {}): MediaGalleryItem {
	return { ...props, media: { url } };
}

export function Gallery(items: MediaGalleryItem[] = []): MediaGalleryComponent {
	return { items, type: ComponentTypes.MEDIA_GALLERY };
}

export function Container(items: ContainerComponent["components"] = [], props: Omit<ContainerComponent, "type" | "components"> = {}): ContainerComponent {
	return { ...props, components: items, type: ComponentTypes.CONTAINER };
}

export function ActionRow(items: MessageActionRowComponent[] = []): MessageActionRow {
	return { components: items, type: ComponentTypes.ACTION_ROW };
}

export function LinkButton(label: string, url: string, props: Omit<URLButton, "type" | "label" | "url" | "style"> = {}): URLButton {
	return { ...props, label, url, style: ButtonStyles.LINK, type: ComponentTypes.BUTTON };
}
