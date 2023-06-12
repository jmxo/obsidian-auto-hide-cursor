import { App, Plugin, PluginSettingTab, Setting } from "obsidian";

interface Settings {
	reappearMode: "movement" | "delay";
	threshold: number;
	time: number;
}

const DEFAULT_SETTINGS: Settings = {
	reappearMode: "movement",
	threshold: 3,
	time: 500,
}

export default class PopoutWindowListenerPlugin extends Plugin {
	settings: Settings;
	scrollMoveHandler = this.scrollMoveWrapper.bind(this)
	reappearMoveHandler = this.reappearMoveWrapper.bind(this)
	scrollUnscrollHandler = this.scrollUnscrollWrapper.bind(this)
	timeout: NodeJS.Timeout
	scrolling = false
	scroll = false
	
	async onload() {
		await this.loadSettings();
		this.addSettingTab(new AHCSettings(this.app, this));

		this.app.workspace.onLayoutReady(() => {
			// movement else delay
			if (this.settings.reappearMode === "movement") {
				this.registerDomEvent(
					document.body,
					"scroll",
					this.scrollMoveHandler,
					{ capture: true }
				);

				this.registerDomEvent(
					document.body,
					"mousemove",
					this.reappearMoveHandler,
					{ capture: true }
				);
			} else {
				this.registerDomEvent(
					document.body,
					"scroll",
					this.scrollUnscrollHandler,
					{ capture: true }
				);
			}
		});
	}

	async loadSettings() {
		this.settings = { ...DEFAULT_SETTINGS, ...await this.loadData() };
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}


	scrollMove = (targetElement: HTMLElement) => {
		targetElement.classList.add("hide-cursor");
		this.scroll = true
	}

	scrollMoveWrapper() {
		if (!this.scroll) {
			this.scrollMove(document.body)
		}
	}

	reappearMove = (evt: MouseEvent, targetElement: HTMLElement) => {
		// to avoid listener always running 
		if (this.scroll && this.isMouseMovementExceededThreshold(evt)) {
			targetElement.classList.remove("hide-cursor");
			this.scroll = false
		}
	}

	reappearMoveWrapper(evt: MouseEvent) {
		this.reappearMove(evt, document.body);
	}

	isMouseMovementExceededThreshold(evt: MouseEvent) {
		const threshold = this.settings.threshold;
		const deltaX = Math.abs(evt.movementX);
		const deltaY = Math.abs(evt.movementY);
		return deltaX > threshold || deltaY > threshold;
	}


	scrollUnscroll = (targetElement: HTMLElement) => {
		if (!this.scrolling) {
			targetElement.classList.add("hide-cursor");
			this.scrolling = true;
		}

		if (this.scrolling) {
			clearTimeout(this.timeout);
			this.timeout = setTimeout(() => {
				targetElement.classList.remove("hide-cursor");
				this.scrolling = false;
				console.log("fini")
			}, this.settings.time);
		}
	}

	scrollUnscrollWrapper() {
		this.scrollUnscroll(document.body)
	}
}


class AHCSettings extends PluginSettingTab {
	plugin: PopoutWindowListenerPlugin;

	constructor(app: App, plugin: PopoutWindowListenerPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();
		containerEl.createEl('h2', { text: 'Auto Hide Cursor settings.' });

		new Setting(containerEl)
			.setName("Cursor Reappearance")
			.setDesc("Reappear after a delay or after moving the cursor.")
			.addDropdown((dropdown) => {
				dropdown
					.addOptions({
						movement: "movement",
						delay: "delay",
					})
					.setValue(this.plugin.settings.reappearMode)
					.onChange(async (value: "movement" | "delay") => {
						this.plugin.settings.reappearMode = value;
						if (value === "movement") {
							this.plugin.registerDomEvent(
								document.body,
								"scroll",
								this.plugin.scrollMoveHandler,
								{ capture: true }
							);

							this.plugin.registerDomEvent(
								document.body,
								"mousemove",
								this.plugin.reappearMoveHandler,
								{ capture: true }
							);

							document.body.removeEventListener(
								'scroll',
								this.plugin.scrollUnscrollHandler,
								{ capture: true }
							)

						} else {
							this.plugin.registerDomEvent(
								document.body,
								"scroll",
								this.plugin.scrollUnscrollHandler,
								{ capture: true }
							);

							document.body.removeEventListener(
								'scroll',
								this.plugin.scrollMoveHandler,
								{ capture: true }
							);
							
							document.body.removeEventListener(
								'mousemove',
								this.plugin.reappearMoveHandler,
								{ capture: true }
							);
						}
						this.plugin.saveSettings();
					});
			});
		
		new Setting(containerEl)
			.setName("Move threshold in px. (default 3)")
			.setDesc("Min. distance to show the cursor again in movement mode")
			.addSlider((slider) => {
				slider
					.setLimits(0, 10, 1)
					.setValue(this.plugin.settings.threshold)
					.setDynamicTooltip()
					.onChange(async (value) => {
						this.plugin.settings.threshold = value;
						await this.plugin.saveSettings();
					});
			})
			.addExtraButton(btn => {
				btn
					.setIcon("reset")
					.setTooltip("Reset to default")
					.onClick(async () => {
						this.plugin.settings.threshold = DEFAULT_SETTINGS.threshold;
						console.log("this.plugin.settings.moveThreshold", this.plugin.settings.threshold)
						await this.plugin.saveSettings();
						this.display()
					});
			});
		
		new Setting(containerEl)
			.setName("Time threshold in ms (default 500)")
			.setDesc("Min. time to show the cursor again in delay mode")
			.addSlider((slider) => {
				slider
					.setLimits(200, 700, 25)
					.setValue(this.plugin.settings.time)
					.setDynamicTooltip()
					.onChange(async (value) => {
						this.plugin.settings.time = value;
						await this.plugin.saveSettings();
					});
			})
			.addExtraButton(btn => {
				btn
					.setIcon("reset")
					.setTooltip("Reset to default")
					.onClick(async () => {
						this.plugin.settings.time = DEFAULT_SETTINGS.time;
						await this.plugin.saveSettings();
						this.display()
					});
			});
	}
}