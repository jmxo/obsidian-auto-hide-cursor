import { Plugin } from "obsidian";

export default class PopoutWindowListenerPlugin extends Plugin {
	async onload() {
		this.setupEventListeners(document.body);

		this.registerEvent(
			this.app.workspace.on("layout-change", () => {
				setTimeout(() => {
					this.setupEventListeners(activeDocument.body);
				}, 1000);
			})
		);
	}

	setupEventListeners(targetElement: HTMLElement) {
		this.registerDomEvent(
			targetElement,
			"scroll",
			() => {
				targetElement.classList.add("hide-cursor");
			},
			{ capture: true }
		);

		this.registerDomEvent(
			targetElement,
			"mousemove",
			() => {
				targetElement.classList.remove("hide-cursor");
			},
			{ capture: true }
		);
	}
}
