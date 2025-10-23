// src/index.ts
import { Lightning, Launch, PlatformSettings, AppData } from '@lightningjs/sdk'
import App from './App'

// ⚠️ El bootstrap (startApp.js) espera un *default export* que sigui una funció
// que retorni Launch(...)
export default function (
  appSettings: Lightning.Application.Options,
  platformSettings: PlatformSettings,
  appData: AppData,
) {
  return Launch(App as any, appSettings, platformSettings, appData)
}
