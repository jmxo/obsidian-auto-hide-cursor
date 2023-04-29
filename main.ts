import { Plugin } from "obsidian";

export default class AutoHideCursorPlugin extends Plugin {
	async onload() {
		document.body.addEventListener(
			"scroll",
			() => {
				document.body.classList.add("hide-cursor");
			},
			{ capture: true }
		);

		document.body.addEventListener(
			"mousemove",
			() => {
				document.body.classList.remove("hide-cursor");
			},
			{ capture: true }
		);
	}

	async unload() {
		document.body.classList.remove("hide-cursor");
		document.body.removeEventListener("scroll", () => {}, {
			capture: true,
		});
		document.body.removeEventListener("mousemove", () => {}, {
			capture: true,
		});
	}
}
