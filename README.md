# Snack Attack ULTIMATE

Jeu mobile transforme en application Android autonome avec Capacitor.

## APK Android

La compilation automatique produit :

- `Snack-Attack-Autonomous.apk`
- un artefact GitHub Actions conserve pendant 30 jours
- une Release permanente nommee **Snack Attack autonome**

## Identifiant Android

`com.tikowiko.snackattack`

## Compilation locale

```bash
npm install
npm run prepare:web
npx cap add android
npx cap sync android
cd android
./gradlew assembleDebug
```

L APK se trouve ensuite dans :

`android/app/build/outputs/apk/debug/app-debug.apk`

Le jeu est embarque dans l application et ne depend pas d un serveur web.
