import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "app.web.relaxai.lightning",
  appName: "RlaxAI",
  webDir: "build",
  server: {
    androidScheme: "https",
    allowNavigation: ["*"],
  },
};

export default config;
