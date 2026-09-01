import { ModuleSettings } from "./settings.mjs";
import { SayAs } from "./say-as.mjs";

Hooks.once("init", ModuleSettings.init);
Hooks.once("init", SayAs.init);
