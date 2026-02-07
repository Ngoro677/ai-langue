# PWA et génération APK Android

## Ce qui est configuré

- **Manifest PWA** (`src/app/manifest.ts`) : nom, icônes, thème, mode `standalone` pour une expérience type app.
- **Connexion requise** : si l’utilisateur n’a pas internet, un écran « Connexion requise » s’affiche et l’app ne peut pas être utilisée. Toutes les fonctionnalités existantes du web sont conservées quand la connexion est présente.

## Icônes PWA (recommandé)

Pour un rendu optimal sur tous les appareils et pour l’APK :

1. Créez deux images à partir de `public/logo.png` :
   - **192×192 px** → enregistrez en `public/icon-192.png`
   - **512×512 px** → enregistrez en `public/icon-512.png`
2. Dans `src/app/manifest.ts`, remplacez les `src: '/logo.png'` par `/icon-192.png` et `/icon-512.png` pour les tailles correspondantes.

Si vous ne faites pas cette étape, le `logo.png` actuel est utilisé (éventuellement redimensionné par le navigateur).

## Générer l’APK Android

Deux approches possibles : **Capacitor** (recommandé, même config que Smart-Rh) ou **PWA Builder**.

---

### Option A — Capacitor (configuration type Smart-Rh)

Le projet est configuré avec **Capacitor** comme dans Smart-Rh : l’app Android est une WebView qui charge l’URL de l’app déployée (ex. Vercel).

1. **Prérequis** : `capacitor.config.ts` à la racine, `appId: 'com.ialangue.app'`, `appName: 'IAlangue'`, `server.url` pointant vers votre app en HTTPS.
2. **Créer le projet Android** :
   ```bash
   npm install
   npx cap add android
   ```
3. **Appliquer la config type Smart-Rh** (SDK 35, Java 17, variables centralisées) : suivre **[docs/capacitor-android/README.md](capacitor-android/README.md)** et copier les fichiers Gradle depuis `docs/capacitor-android/`.
4. **Sync et build** :
   ```bash
   npx cap sync
   npx cap open android
   ```
   Puis dans Android Studio : **Build → Build APK(s)**.

5. **Audio (micro + Écouter)** : le manifeste Android déclare `RECORD_AUDIO` et `MODIFY_AUDIO_SETTINGS` ; `MainActivity` configure le WebView pour la lecture sans geste (`setMediaPlaybackRequiresUserGesture(false)`) et demande la permission micro au démarrage. À la première utilisation du micro, accepter la demande de permission.

Scripts npm utiles : `npm run cap:sync`, `npm run cap:open:android`.

---

### Option B — PWA Builder (TWA)

Une PWA ne produit pas d’APK toute seule. Il faut **empaqueter** la PWA dans une app Android (TWA ou WebView). Méthode simple et gratuite :

### 1. Déployer la PWA en HTTPS

L’app doit être accessible en HTTPS, par exemple :

- `https://ai-langue.vercel.app` (ou votre domaine)

### 2. Utiliser PWA Builder (Microsoft)

1. Allez sur **https://www.pwabuilder.com**
2. Entrez l’URL de votre app (ex. `https://ai-langue.vercel.app`) puis **Start**.
3. Corrigez les éventuels avertissements (manifest, icônes, etc.).
4. Cliquez sur **Package for stores** (ou **Build my PWA**).
5. Choisissez **Android** → téléchargez le package **Android (APK)**.
6. Vous obtenez un projet Android (ou un APK selon l’option). Pour avoir un **APK** directement, choisissez l’option qui génère l’APK (souvent via « Download » après la génération).

### 3. Alternative : Bubblewrap (Google)

- Outil en ligne de commande pour créer une **Trusted Web Activity** (TWA) à partir de l’URL de votre PWA.
- Documentation : https://github.com/GoogleChromeLabs/bubblewrap

---

## Résumé

| Élément | Statut |
|--------|--------|
| PWA (manifest, standalone) | ✅ Configuré |
| Connexion obligatoire (pas d’usage hors ligne) | ✅ Écran « Connexion requise » |
| Fonctionnalités web conservées | ✅ Inchangées avec connexion |
| Génération APK | **Capacitor** : `npx cap add android` puis config type Smart-Rh (voir [capacitor-android/README.md](capacitor-android/README.md)) ; ou PWABuilder / Bubblewrap avec l’URL HTTPS |
