# demo-v2

## com.domain.app.demov2

### Getting started

> Before you follow the steps below, make sure you have the
> [Lightning-CLI](https://rdkcentral.github.io/Lightning-CLI/#/) installed _globally_ only your system

```
npm install -g @lightningjs/cli
```

#### Running the App

1. Install the NPM dependencies by running `npm install`

2. Build the App using the _Lightning-CLI_ by running `lng build` inside the root of your project

3. Fire up a local webserver and open the App in a browser by running `lng serve` inside the root of your project

#### Developing the App

During development you can use the **watcher** functionality of the _Lightning-CLI_.

- use `lng watch` to automatically _rebuild_ your App whenever you make a change in the `src` or `static` folder
- use `lng dev` to start the watcher and run a local webserver / open the App in a browser _at the same time_

#### Documentation

Use `lng docs` to open up the Lightning-SDK documentation.

# 📱 Build de Android (APK/AAB) con Capacitor

## 1️⃣ Requisitos previos (instalar una sola vez)

- **Node.js** 18+ y **npm**
- **Android Studio** (incluye SDK, Build Tools y emulador)
- **JDK 17** (recomendado por Gradle/Android)
- **Capacitor** en el proyecto:

  ```bash
  npm i -D @capacitor/cli
  npm i @capacitor/core
  ```

> Si es la primera vez que integras Capacitor:
>
> ```bash
> npx cap init "RelaxAI WebTV" com.relaxai.webtv --web-dir=build
> npx cap add android
> ```

Asegúrate de que tu app Lightning genera la carpeta `build/` con:

```bash
lng build
```

---

## 2️⃣ Flujo de build (APK de debug)

1. **Compila la web** de Lightning:
   ```bash
   lng build
   ```
2. **Copia los archivos web a Android:**
   ```bash
   npx cap copy android
   ```
3. **Compila el APK de debug:**
   ```bash
   cd android
   ./gradlew assembleDebug
   ```

📍 **APK generado en:**

```
android/app/build/outputs/apk/debug/app-debug.apk
```

Puedes instalarlo directamente en tu dispositivo o emulador Android.

---

## 3️⃣ Build de _release_ (firmado)

### 3.1 Crear un keystore (una vez)

```bash
keytool -genkeypair -v -keystore my-release-key.jks   -keyalg RSA -keysize 2048 -validity 10000 -alias relaxai
```

Guarda el archivo `my-release-key.jks` en `android/` o en una ruta segura.

### 3.2 Configurar credenciales

Agrega a `android/gradle.properties`:

```
RELEASE_STORE_FILE=my-release-key.jks
RELEASE_STORE_PASSWORD=tuPassword
RELEASE_KEY_ALIAS=relaxai
RELEASE_KEY_PASSWORD=tuPassword
```

(O usa variables de entorno con los mismos nombres).

En `android/app/build.gradle`, dentro de `android { ... }`, añade:

```gradle
signingConfigs {
    release {
        storeFile file(System.getenv("RELEASE_STORE_FILE") ?: project.properties["RELEASE_STORE_FILE"])
        storePassword System.getenv("RELEASE_STORE_PASSWORD") ?: project.properties["RELEASE_STORE_PASSWORD"]
        keyAlias System.getenv("RELEASE_KEY_ALIAS") ?: project.properties["RELEASE_KEY_ALIAS"]
        keyPassword System.getenv("RELEASE_KEY_PASSWORD") ?: project.properties["RELEASE_KEY_PASSWORD"]
    }
}
buildTypes {
    release {
        signingConfig signingConfigs.release
        minifyEnabled true
        shrinkResources true
        proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
    }
}
```

### 3.3 Generar **APK release**

```bash
lng build
npx cap copy android
cd android
./gradlew assembleRelease
```

📍 **APK generado en:**

```
android/app/build/outputs/apk/release/app-release.apk
```

### 3.4 Generar **AAB (para Google Play)**

```bash
lng build
npx cap copy android
cd android
./gradlew bundleRelease
```

📍 **AAB generado en:**

```
android/app/build/outputs/bundle/release/app-release.aab
```

---

## 4️⃣ Scripts útiles en `package.json`

Agrega estos scripts para automatizar el flujo:

```json
{
  "scripts": {
    "build:web": "lng build",
    "cap:copy": "npx cap copy android",
    "android:debug": "cd android && ./gradlew assembleDebug",
    "android:release:apk": "cd android && ./gradlew assembleRelease",
    "android:release:aab": "cd android && ./gradlew bundleRelease",
    "build:apk": "npm run build:web && npm run cap:copy && npm run android:debug",
    "build:aab": "npm run build:web && npm run cap:copy && npm run android:release:aab"
  }
}
```

---

## 5️⃣ Notas para Android TV (opcional pero recomendado)

En `android/app/src/main/AndroidManifest.xml`, añade dentro de `<application>`:

```xml
<uses-feature android:name="android.software.leanback" android:required="false" />
<uses-feature android:name="android.hardware.touchscreen" android:required="false" />

<intent-filter>
  <action android:name="android.intent.action.MAIN" />
  <!-- Launcher para TV -->
  <category android:name="android.intent.category.LEANBACK_LAUNCHER" />
  <!-- Launcher para móviles/tablets -->
  <category android:name="android.intent.category.LAUNCHER" />
</intent-filter>
```

---

## 6️⃣ Capturar botón "Atrás" (Back) en Android

Instala el plugin:

```bash
npm i @capacitor/app
```

Y añade este código en tu `index.ts` o archivo de arranque:

```ts
import { App as CapApp } from "@capacitor/app";

CapApp.addListener("backButton", () => {
  // Reenviar tecla "Backspace" para Lightning (equivale a 'Atrás')
  const ev = new KeyboardEvent("keydown", {
    key: "Backspace",
    keyCode: 8,
    which: 8,
  });
  window.dispatchEvent(ev);
});
```

---

## 7️⃣ Problemas comunes

| Problema                  | Solución                                                                                                              |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Pantalla negra al abrir   | Asegúrate de que `webDir` en `capacitor.config.ts` apunta a `build` y ejecutaste `lng build` antes de `npx cap copy`. |
| Botón atrás cierra la app | Usa el listener `backButton` como el ejemplo anterior.                                                                |
| Faltan SDK/Build Tools    | En Android Studio → SDK Manager → instala "Android SDK Platform" y "Build-Tools" actualizados.                        |
| Firma inválida            | Revisa las contraseñas del keystore y limpia con `./gradlew clean` si es necesario.                                   |

---

## ✅ Resultado final

Una vez completados los pasos:

- `app-debug.apk` → para pruebas locales.
- `app-release.apk` o `app-release.aab` → para publicar en Google Play o instalar en TV.

## Conect Android Device:

adb connect 192.168.1.39:5555

# command to install Apk Debug in device

# 1) Compilar i preparar APK

npm run build:apk

# 2) Connectar per Wi-Fi ADB

export ANDROID_IP=192.168.1.39
npm run android:connect

# 3) Instal·lar l’APK de debug

npm run android:install

# Comandes útils

### Desinstal·lar ràpid:

npm run android:uninstall

### Veure logs de la WebView/Capacitor:

npm run android:logs

chrome://inspect/#devices

# DEMO
https://francbonet.github.io/relaxai.web.app/
