import { BASE_URL } from "../base";

const BASE_API = `${BASE_URL}/api`;

/** Créer un client (POST) */
export const CREATE_CLIENT_URL = `${BASE_API}/clients`;
/** Création en masse (POST), body : array de { nomClient, prenomClient, idCarteBancaire, typeContrat } */
export const BULK_CREATE_CLIENTS_URL = `${BASE_API}/clients/bulk`;
/** Liste des clients (GET) */
export const LIST_CLIENTS_URL = `${BASE_API}/clients`;
/** Détail / Modifier / Supprimer (GET, PUT, DELETE) */
export const getClientUrl = (id) => `${BASE_API}/clients/${id}`;
