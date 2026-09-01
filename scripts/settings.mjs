import { MODULE, SETTINGS } from "./const.mjs";

export class ModuleSettings {

  static init() {
    game.settings.register(MODULE, SETTINGS.ENABLED, {
      name: "SAYAS.SETTINGS.Enabled.Name",
      hint: "SAYAS.SETTINGS.Enabled.Hint",
      scope: "world",
      type: Boolean,
      config: true,
      default: true,
      requiresReload: true
    });
  }
}
