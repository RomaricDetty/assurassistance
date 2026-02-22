# Assur'Assistance Admin Backoffice

Back-office d'administration pour **Assur'Assistance**.

## Description

Application web de gestion des clients et de génération de contrats PDF pour Assur'Assistance.

## Fonctionnalités principales

- **Tableau de bord** : Statistiques et nombre de clients par type de contrat (Business, Premier, Platinum)
- **Clients** : Liste, création, modification et suppression des clients avec pagination
- **Contrats clients** : Saisie (formulaire ou Excel), enregistrement du client et génération des contrats PDF
- **Administration** : Gestion des administrateurs (liste paginée)
- **Profil** : Consultation et modification des informations de l'administrateur connecté
- **Authentification** : Connexion / déconnexion, persistance de session
- **Thème** : Mode clair ou sombre (persistant, mode sombre par défaut)

## Technologies

- **React 19** avec Vite
- Redux (redux-persist, redux-thunk)
- React Router
- Bootstrap 5, pdf-lib, xlsx

## Prérequis

- **Node.js** : version 18 ou supérieure (recommandé : 20 LTS)

Vérifier la version installée : `node -v`

## Installation

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Auteur

Detty Romaric
