import "./polyfills";
import "core-js/stable";
import "regenerator-runtime/runtime";
import "whatwg-fetch";
import { Lightning, Launch, PlatformSettings, AppData } from "@lightningjs/sdk";
import App from "./App";

// Dona-li un nom a la funció per poder-la enganxar al window
export default function bootstrap(
  appSettings: Lightning.Application.Options,
  platformSettings: PlatformSettings,
  appData: AppData
) {
  return Launch(App as any, appSettings, platformSettings, appData);
}

// @ts-ignore
(window as any).APP_RELAXAI = bootstrap;
