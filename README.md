# demo-v2 · com.domain.app.demov2

## 🌐 Live Demo on GitHub Pages

🔗 **Project URL:** [https://francbonet.github.io/relaxai.web.app/](https://francbonet.github.io/relaxai.web.app/)

---

## 🚀 Getting Started

> Before you start, make sure you have **Lightning-CLI** installed **globally** on your system.

```bash
npm install -g @lightningjs/cli
```

### Run Locally (Development)

```bash
npm install
npm run start      # same as `lng dev` (watch + local server)
```

### Build the Web Version

```bash
npm run build:web  # runs `lng build` + index patch
npm run build:es5  # (optional) transpiles for older WebViews
```

> If you only need a simple build without patches/transpilation:
>
> ```bash
> npm run build    # `lng build`
> ```

### Lightning SDK Docs

```bash
lng docs
```

---

## 📦 Android Build with Capacitor

### Prerequisites (once)

- Node.js 18+ and npm
- Android Studio (SDK + Build Tools)
- JDK 17
- Capacitor in your project:
  ```bash
  npm i -D @capacitor/cli
  npm i @capacitor/core
  ```
- Initialization (only if you don’t have `android/` yet):
  ```bash
  npx cap init "RelaxAI WebTV" com.relaxai.webtv --web-dir=build
  npx cap add android
  ```

### Quick Debug APK

```bash
npm run build:apk    # web build + ES5 + cap copy + assembleDebug
```

📍 **Generated APK:**
```
android/app/build/outputs/apk/debug/app-debug.apk
```

### Connect to an Android Device

#### 1️⃣ Connect via Wi‑Fi using ADB
```bash
export ANDROID_IP=192.168.1.39
npm run android:connect
```

#### 2️⃣ Install the APK
```bash
npm run android:install
```

#### 3️⃣ View WebView/Capacitor Logs
```bash
npm run android:logs
```

---

### Release Build (AAB / APK)

```bash
npm run build:aab          # web + ES5 + cap copy + bundleRelease
npm run android:release:apk   # optional, if you already ran cap copy
```

> Remember to sign your release using a keystore file.
> Use environment variables or `gradle.properties` for credentials.

---

## 🌐 Deploy to GitHub Pages

```bash
npm run deploy:gh  # web build + ES5 + prepare + push to gh-pages
```

---

## 🔧 Available Scripts

```json
{
  "scripts": {
    "prepare": "husky install",
    "start": "lng dev",
    "build": "lng build",
    "build:web": "lng build && node scripts/patch-index.mjs",
    "build:es5": "node scripts/build-es5.mjs",
    "cap:copy": "npx cap copy android",
    "android:debug": "cd android && ./gradlew assembleDebug",
    "android:release:apk": "cd android && ./gradlew assembleRelease",
    "android:release:aab": "cd android && ./gradlew bundleRelease",
    "build:apk": "npm run build:web && npm run build:es5 && npm run cap:copy && cd android && ./gradlew assembleDebug",
    "build:aab": "npm run build:web && npm run build:es5 && npm run cap:copy && cd android && ./gradlew bundleRelease",
    "android:connect": "adb connect $ANDROID_IP:5555",
    "android:install": "adb install -r android/app/build/outputs/apk/debug/app-debug.apk",
    "android:uninstall": "adb uninstall app.web.relaxai.lightning",
    "android:logs": "adb logcat Chromium:D Capacitor:D *:S",
    "android:refresh": "cd android && ./gradlew clean && cd .. && npx cap sync android && npm run android:debug",
    "deploy:gh": "npm run build:web && npm run build:es5 && node scripts/prepare-gh-pages.mjs && node scripts/deploy-gh-pages.mjs"
  }
}
```

---

## 🧩 Quick Notes / Troubleshooting

| Issue | Solution |
|-------|-----------|
| **Black screen on launch** | Make sure `--web-dir` points to `build` and that you ran `npm run build:web` before `cap copy`. |
| **Old WebViews (Android 6/TV)** | Use `npm run build:es5` for compatibility. |
| **Back button closes app** | Add `@capacitor/app` and listen to `backButton` to forward a `Backspace` event to Lightning. |
| **Missing SDK/Build Tools** | Install them via Android Studio → SDK Manager. |

---

## 📱 Final Output

- `app-debug.apk` → for local testing
- `app-release.apk` or `.aab` → for Google Play or TV installation
