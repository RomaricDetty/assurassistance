# assurassistance
Dashboard de generation de fichiers PDF pour Assur'Assistance


# Assur'Assistance - Tableau de bord pour generation de fichiers PDF

Ce tableau de bord est une application [Next.js](https://nextjs.org) conçue pour Assur'Assistance.

## Fonctionnalités

- **Authentification sécurisée** avec Next-Auth
- **Tableau de bord** centralisé pour gérer votre activité
- **Generation de fichiers PDF** et interface pour liste des fichiers deja generes

## Installation

```bash
# Installation des dépendances
pnpm install

# Configuration des variables d'environnement
cp .env.example .env.local
# Modifiez les variables dans .env.local selon vos besoins

# Lancement du serveur de développement
pnpm dev
```

L'application sera accessible à l'adresse [http://localhost:3001](http://localhost:3001).

## Structure du projet

```
assurassistance/
├── app/                  # Routes de l'application (App Router)
│   ├── (auth)/           # Routes d'authentification
│   ├── api/              # API routes
│   └── dashboard/        # Interface du tableau de bord
├── components/           # Composants réutilisables
├── features/             # Fonctionnalités organisées par domaine
│   ├── account/          # Gestion de compte
│   └── caisse/           # Fonctionnalités de caisse
└── ...
```

## Technologies utilisées

- [Next.js 15](https://nextjs.org/) - Framework React
- [React 19](https://react.dev/) - Bibliothèque UI
- [NextAuth](https://next-auth.js.org/) - Authentification
- [Tailwind CSS](https://tailwindcss.com/) - Styles
- [Radix UI](https://www.radix-ui.com/) - Composants accessibles
- [React Query](https://tanstack.com/query/latest) - Gestion des données

## Développement

Pour exécuter les tests linting :

```bash
pnpm lint
```

Pour construire l'application pour la production :

```bash
pnpm build
```

Pour démarrer l'application en mode production :

```bash
pnpm start
```

## Ressources

Pour en savoir plus sur les technologies utilisées :

- [Documentation Next.js](https://nextjs.org/docs) - fonctionnalités et API de Next.js
- [Guide d'API Next.js](https://nextjs.org/learn) - tutoriel interactif pour Next.js
- [Dépôt GitHub Next.js](https://github.com/vercel/next.js) - contributions bienvenues !

## Déploiement

Le moyen le plus simple de déployer cette application est d'utiliser la [plateforme Vercel](https://vercel.com/new) créée par les développeurs de Next.js.

Consultez la [documentation de déploiement Next.js](https://nextjs.org/docs/app/building-your-application/deploying) pour plus de détails sur d'autres options de déploiement.
