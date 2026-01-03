# 🚀 Guide de Déploiement sur Vercel

Ce guide vous explique comment déployer votre portfolio sur Vercel et configurer les variables d'environnement, notamment `OPENAI_API_KEY`.

## 📋 Prérequis

- Un compte Vercel ([https://vercel.com](https://vercel.com))
- Votre code poussé sur GitHub, GitLab ou Bitbucket
- Une clé API OpenAI (voir section Configuration OpenAI dans README.md)

## 🔧 Configuration des Variables d'Environnement sur Vercel

### ⚠️ IMPORTANT : Pourquoi `.env.local` n'est pas déployé ?

Le fichier `.env.local` est dans `.gitignore` pour des raisons de sécurité. Cela signifie :
- ✅ **Localement** : Vous utilisez `.env.local` pour le développement
- ✅ **Sur Vercel** : Vous devez configurer les variables d'environnement directement dans le dashboard Vercel

### 📝 Étapes pour configurer `OPENAI_API_KEY` sur Vercel

#### 1. Connecter votre projet à Vercel

1. Allez sur [https://vercel.com](https://vercel.com) et connectez-vous
2. Cliquez sur **"Add New Project"** ou **"Import Project"**
3. Importez votre repository depuis GitHub/GitLab/Bitbucket
4. Vercel détectera automatiquement que c'est un projet Next.js

#### 2. Configurer les variables d'environnement

1. **Dans le dashboard Vercel**, après avoir importé votre projet, allez dans :
   - **Settings** (Paramètres) → **Environment Variables** (Variables d'environnement)

2. **Ajoutez votre clé OpenAI** :
   - Cliquez sur **"Add New"** ou **"Add"**
   - **Name** (Nom) : `OPENAI_API_KEY`
   - **Value** (Valeur) : `sk-proj-votre-cle-api-ici` (collez votre clé API OpenAI)
   - **Environments** (Environnements) : Cochez les environnements où vous voulez utiliser cette variable :
     - ✅ **Production** (pour le site en production)
     - ✅ **Preview** (pour les previews de branches)
     - ✅ **Development** (optionnel, pour le développement local via Vercel CLI)

3. Cliquez sur **"Save"** (Enregistrer)

4. **Si vous avez d'autres variables d'environnement**, ajoutez-les aussi :
   - `PRISMIC_API_ENDPOINT` (si vous utilisez Prismic)
   - `PRISMIC_ACCESS_TOKEN` (si vous utilisez Prismic)
   - Toute autre variable que votre projet utilise

#### 3. Déployer ou Redéployer

1. **Premier déploiement** : Vercel déploiera automatiquement votre projet après l'import
2. **Après avoir ajouté des variables** : Vous devez redéployer :
   - Allez dans l'onglet **"Deployments"** (Déploiements)
   - Trouvez le dernier déploiement
   - Cliquez sur les **3 points** (⋯) à droite
   - Sélectionnez **"Redeploy"** (Redéployer)
   - Ou créez un nouveau commit et poussez-le pour déclencher un nouveau déploiement

#### 4. Vérifier que tout fonctionne

1. Allez sur votre site déployé : `https://votre-projet.vercel.app`
2. Testez le chatbot - il devrait utiliser l'API OpenAI si la clé est correctement configurée
3. Si le chatbot ne fonctionne pas :
   - Vérifiez dans **Settings** → **Environment Variables** que `OPENAI_API_KEY` est bien présente
   - Vérifiez que vous avez redéployé après avoir ajouté la variable
   - Vérifiez les logs de déploiement dans Vercel pour voir s'il y a des erreurs

## 🔍 Vérification des Variables d'Environnement

### Dans le Dashboard Vercel

1. Allez dans **Settings** → **Environment Variables**
2. Vous devriez voir toutes vos variables listées
3. Vous pouvez voir pour quels environnements chaque variable est configurée

### Dans les Logs de Déploiement

1. Allez dans **Deployments** → Cliquez sur un déploiement
2. Regardez les **Build Logs** (Logs de construction)
3. Les variables d'environnement ne sont PAS affichées dans les logs (pour la sécurité)
4. Mais vous verrez si le build réussit ou échoue

## ⚠️ Notes Importantes

### Sécurité

- ✅ **Les variables d'environnement sont sécurisées** : Elles ne sont jamais exposées au client (sauf celles préfixées par `NEXT_PUBLIC_`)
- ✅ **Ne partagez JAMAIS vos clés API** publiquement
- ✅ **Utilisez des valeurs différentes** pour Production, Preview et Development si nécessaire

### Redéploiement

- ⚠️ **Après avoir ajouté/modifié des variables**, vous DEVEZ redéployer pour que les changements prennent effet
- ⚠️ Les variables sont chargées au moment du build, pas à l'exécution

### Environnements

- **Production** : Variables utilisées pour le site en production (`votre-projet.vercel.app`)
- **Preview** : Variables utilisées pour les previews de branches (pull requests, etc.)
- **Development** : Variables utilisées pour le développement local avec Vercel CLI (optionnel)

## 🛠️ Développement Local avec Vercel CLI (Optionnel)

Si vous voulez tester localement avec les mêmes variables que sur Vercel :

1. Installez Vercel CLI :
   ```bash
   npm i -g vercel
   ```

2. Connectez-vous :
   ```bash
   vercel login
   ```

3. Liez votre projet :
   ```bash
   vercel link
   ```

4. Les variables d'environnement seront automatiquement chargées depuis Vercel

## 📞 Support

Si vous rencontrez des problèmes :

1. Vérifiez les logs de déploiement dans Vercel
2. Vérifiez que toutes les variables d'environnement sont bien configurées
3. Vérifiez que vous avez redéployé après avoir ajouté des variables
4. Consultez la documentation Vercel : [https://vercel.com/docs](https://vercel.com/docs)

---

**Bon déploiement ! 🚀**

