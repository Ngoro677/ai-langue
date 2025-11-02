# Portfolio Ny Nivoarijaona

Un portfolio moderne et professionnel développé avec Next.js, GSAP et Prismic CMS.

## 🚀 Fonctionnalités

- **Design moderne et professionnel** avec thème sombre
- **Animations fluides** avec GSAP
- **Gestion de contenu** avec Prismic CMS
- **Responsive design** pour tous les appareils
- **Performance optimisée** avec Next.js 15
- **TypeScript** pour une meilleure maintenabilité

## 🛠️ Technologies utilisées

- **Next.js 15** - Framework React
- **TypeScript** - Typage statique
- **Tailwind CSS** - Framework CSS
- **GSAP** - Animations avancées
- **Prismic** - CMS headless
- **Lucide React** - Icônes

## 📦 Installation

1. Clonez le repository :
```bash
git clone <votre-repo>
cd mon-projet
```

2. Installez les dépendances :
```bash
npm install
```

3. Configurez les variables d'environnement :
```bash
cp env.example .env.local
```

4. Modifiez le fichier `.env.local` avec vos clés Prismic :
```
PRISMIC_API_ENDPOINT=https://votre-repo.prismic.io/api/v2
PRISMIC_ACCESS_TOKEN=votre-token-ici
```

## 🚀 Démarrage

```bash
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur.

## 📁 Structure du projet

```
src/
├── app/                 # Pages Next.js
│   ├── globals.css     # Styles globaux
│   ├── layout.tsx      # Layout principal
│   └── page.tsx        # Page d'accueil
├── components/         # Composants React
│   ├── Header.tsx      # En-tête avec navigation
│   ├── Hero.tsx        # Section hero
│   ├── Projects.tsx    # Section projets
│   ├── Technologies.tsx # Section technologies
│   ├── Clients.tsx     # Section clients
│   ├── Footer.tsx      # Pied de page
│   └── BottomNavigation.tsx # Navigation mobile
├── lib/               # Utilitaires
│   └── prismic.ts     # Configuration Prismic
└── public/            # Assets statiques
    └── images/        # Images et icônes
```

## 🎨 Personnalisation

### Ajouter votre photo de profil

Remplacez le fichier `public/images/profile.jpg` par votre photo.

### Modifier les projets

Les projets sont définis dans `src/components/Projects.tsx`. Vous pouvez :
- Modifier les données directement dans le composant
- Intégrer avec Prismic pour une gestion dynamique

### Personnaliser les couleurs

Modifiez les variables CSS dans `src/app/globals.css` :

```css
:root {
  --background: #0f0f0f;
  --foreground: #ffffff;
  --primary: #dc2626;
  --secondary: #1f2937;
  --accent: #3b82f6;
}
```

## 🔧 Configuration Prismic

1. Créez un compte sur [Prismic](https://prismic.io)
2. Créez un nouveau repository
3. Configurez les types de contenu :
   - `project` - Pour les projets
   - `technology` - Pour les technologies
   - `client` - Pour les clients
   - `testimonial` - Pour les témoignages

4. Ajoutez vos clés API dans `.env.local`

## 📱 Responsive Design

Le portfolio est entièrement responsive avec :
- **Mobile First** - Optimisé pour mobile
- **Tablette** - Adaptation pour tablettes
- **Desktop** - Expérience complète sur desktop

## 🎭 Animations GSAP

Les animations incluent :
- **Fade In** - Apparition en fondu
- **Slide In** - Glissement depuis les côtés
- **Scale In** - Agrandissement progressif
- **Parallax** - Effet de parallaxe
- **Scroll Trigger** - Animations au scroll

## 🚀 Déploiement

### Vercel (Recommandé)

1. Connectez votre repository à Vercel
2. Configurez les variables d'environnement
3. Déployez automatiquement

### Autres plateformes

```bash
npm run build
npm start
```

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 👨‍💻 Auteur

**Ny Nivoarijaona**
- Email: nynivoarijaona@gmail.com
- Téléphone: 034 15 684 08
- Localisation: Madagascar

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à :
1. Fork le projet
2. Créer une branche feature
3. Commit vos changements
4. Push vers la branche
5. Ouvrir une Pull Request

## 📞 Support

Pour toute question ou support, contactez-moi à nynivoarijaona@gmail.com

---

**Développé avec ❤️ par Ny Nivoarijaona**