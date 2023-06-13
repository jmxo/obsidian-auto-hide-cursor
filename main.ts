import { App, Plugin, PluginSettingTab, Setting } from "obsidian";

interface CursorSettings {
	movementThreshold: number;
	delayTime: number;
}

const DEFAULT_CURSOR_SETTINGS: CursorSettings = {
	movementThreshold: 3,
	delayTime: 500,
};

const HIDE_CURSOR_CLASS = "hide-cursor";

export default class AutoHideCursorPlugin extends Plugin {
	settings: CursorSettings;
	cursorTimeout: NodeJS.Timeout;
	isCursorMoving = false;

	async onload() {
		await this.loadUserSettings();
		this.addSettingTab(new AutoHideCursorSettingsTab(this.app, this));

		this.app.workspace.onLayoutReady(() => {
			this.setEventListeners(document.body);
		});

		// to support popout windows
		this.registerEvent(
			this.app.workspace.on("layout-change", () => {
				setTimeout(() => {
					this.setEventListeners(activeDocument.body);
				}, 1000);
			})
		);
	}

	setEventListeners(targetElement: HTMLElement) {
		targetElement.removeEventListener(
			"mousemove",
			this.handleCursorMovement,
			{ capture: true }
		);
		targetElement.removeEventListener("scroll", this.handleScrollEvent, {
			capture: true,
		});

		this.registerDomEvent(
			targetElement,
			"mousemove",
			this.handleCursorMovement,
			{ capture: true }
		);
		this.registerDomEvent(targetElement, "scroll", this.handleScrollEvent, {
			capture: true,
		});
	}

	async loadUserSettings() {
		this.settings = {
			...DEFAULT_CURSOR_SETTINGS,
			...(await this.loadData()),
		};
	}

	async saveUserSettings() {
		await this.saveData(this.settings);
		this.setEventListeners(activeDocument.body);
	}

	handleScrollEvent = () => {
		document.body.classList.add(HIDE_CURSOR_CLASS);
		this.isCursorMoving = false;
	};

	handleCursorMovement = (evt: MouseEvent) => {
		if (this.hasCursorMovementExceededThreshold(evt)) {
			clearTimeout(this.cursorTimeout);
			document.body.classList.remove(HIDE_CURSOR_CLASS);
			this.isCursorMoving = true;

			this.cursorTimeout = setTimeout(() => {
				document.body.classList.add(HIDE_CURSOR_CLASS);
				this.isCursorMoving = false;
			}, this.settings.delayTime);
		}
	};

	hasCursorMovementExceededThreshold(evt: MouseEvent) {
		const movementThreshold = this.settings.movementThreshold;
		const deltaX = Math.abs(evt.movementX);
		const deltaY = Math.abs(evt.movementY);
		return deltaX > movementThreshold || deltaY > movementThreshold;
	}
}

class AutoHideCursorSettingsTab extends PluginSettingTab {
	plugin: AutoHideCursorPlugin;

	constructor(app: App, plugin: AutoHideCursorPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();
		containerEl.createEl("h2", { text: "Auto Hide Cursor Settings" });

		new Setting(containerEl)
			.setName("Movement Threshold (px)")
			.setDesc("Minimum distance to show the cursor again")
			.addSlider((slider) => {
				slider
					.setLimits(0, 10, 1)
					.setValue(this.plugin.settings.movementThreshold)
					.setDynamicTooltip()
					.onChange(async (value) => {
						this.plugin.settings.movementThreshold = value;
						await this.plugin.saveUserSettings();
					});
			});

		new Setting(containerEl)
			.setName("Hide Delay (ms)")
			.setDesc("Time to hide the cursor after stopping movement")
			.addSlider((slider) => {
				slider
					.setLimits(200, 1000, 25)
					.setValue(this.plugin.settings.delayTime)
					.setDynamicTooltip()
					.onChange(async (value) => {
						this.plugin.settings.delayTime = value;
						await this.plugin.saveUserSettings();
					});
			});
	}
}
