import { BASE_URL } from "../base";

const BASE_API = `${BASE_URL}/api`;

/** Créer un client (POST) */
export const CREATE_CLIENT_URL = `${BASE_API}/clients`;
/** Liste des clients (GET) */
export const LIST_CLIENTS_URL = `${BASE_API}/clients`;
/** Détail / Modifier / Supprimer (GET, PUT, DELETE) */
export const getClientUrl = (id) => `${BASE_API}/clients/${id}`;
