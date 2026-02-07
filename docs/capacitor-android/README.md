# Configuration Android type Smart-Rh (Capacitor)

Ces fichiers permettent d’aligner le projet Android généré par Capacitor sur la structure et les versions utilisées dans Smart-Rh (SDK 35, Java 17, variables centralisées).

## Étapes

### 1. Installer les dépendances et ajouter Android

À la racine du projet IAlangue :

```bash
npm install
npx cap add android
```

Cela crée le dossier `android/` avec le wrapper Gradle et les sources de base.

### 2. Remplacer les fichiers Gradle par la config type Smart-Rh

- Copiez `docs/capacitor-android/variables.gradle` → `android/variables.gradle` (remplace le fichier existant s’il y en a un).
- Copiez `docs/capacitor-android/build.gradle` → `android/build.gradle`.
- Copiez le contenu de `docs/capacitor-android/app-build.gradle` dans `android/app/build.gradle` (remplace tout le contenu).
- Copiez `docs/capacitor-android/gradle.properties` → `android/gradle.properties` (ou fusionnez avec l’existant, en gardant `android.useAndroidX=true` et `org.gradle.jvmargs`).

### 3. Vérifier le package et le nom de l’app

- `capacitor.config.ts` utilise déjà `appId: 'com.ialangue.app'` et `appName: 'IAlangue'`. Après `cap add android`, le package Java et `applicationId` devraient être `com.ialangue.app`.
- Dans `android/app/src/main/res/values/strings.xml`, vérifiez que `app_name` et `title_activity_main` valent `IAlangue`.

### 4. URL de l’app (WebView)

L’app charge l’URL définie dans `capacitor.config.ts` (`server.url`). Par défaut : `https://ai-langue.vercel.app`. Pour une autre URL :

- Soit modifiez `server.url` dans `capacitor.config.ts`,
- Soit définissez la variable d’environnement `CAPACITOR_SERVER_URL` avant de lancer `npx cap sync`.

### 5. Sync et ouverture dans Android Studio

```bash
npx cap sync
npx cap open android
```

Puis dans Android Studio : **Build → Build Bundle(s) / APK(s) → Build APK(s)** pour générer l’APK.

### 6. Signing release (optionnel)

Pour signer l’APK release (ex. Play Store), créez un keystore puis dans `android/gradle.properties` ajoutez les 4 variables (voir le fichier dans ce dossier). Dans `android/app/build.gradle`, ajoutez un bloc `signingConfigs { release { ... } }` et référencez-le dans `buildTypes.release.signingConfig signingConfigs.release`.
