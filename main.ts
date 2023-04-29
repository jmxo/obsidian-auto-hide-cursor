import { Plugin } from "obsidian";

export default class AutoHideCursorPlugin extends Plugin {
	async onload() {
		document.body.addEventListener(
			"scroll",
			() => {
				document.body.style.cursor = "none";
			},
			{ capture: true }
		);

		document.body.addEventListener(
			"mousemove",
			() => {
				document.body.style.cursor = "auto";
			},
			{ capture: true }
		);
	}

	async unload() {
		document.body.removeEventListener("scroll", () => {}, {
			capture: true,
		});
		document.body.removeEventListener("mousemove", () => {}, {
			capture: true,
		});
	}
}
