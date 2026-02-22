import { BASE_URL } from "../base";

const BASE_API = `${BASE_URL}/api`;

/** URL de login administrateur (POST login, password) */
export const LOGIN_ADMIN_URL = `${BASE_API}/administrateurs/login`;
/** Créer un administrateur (POST, Bearer) */
export const CREATE_ADMIN_URL = `${BASE_API}/administrateurs`;
/** Profil de l'administrateur connecté (GET, token uniquement) */
export const ADMIN_ME_URL = `${BASE_API}/administrateurs/me`;
/** Liste des administrateurs (GET, query isActive optionnel) */
export const LIST_ADMINS_URL = `${BASE_API}/administrateurs`;
/** Détail d'un administrateur (GET /:id) */
export const getAdminDetailUrl = (id) => `${BASE_API}/administrateurs/${id}`;
/** Modifier un administrateur (PUT /:id) */
export const updateAdminUrl = (id) => `${BASE_API}/administrateurs/${id}`;
