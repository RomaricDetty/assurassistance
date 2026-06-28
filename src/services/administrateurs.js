import {
    LOGIN_ADMIN_URL,
    CREATE_ADMIN_URL,
    ADMIN_ME_URL,
    LIST_ADMINS_URL,
    getAdminDetailUrl,
    updateAdminUrl
} from '../config/urls/administrateurs';
import {
    apiGet,
    apiPost,
    apiPut,
    jsonHeaders,
    authHeaders
} from '../utils/apiClient';

export { authHeaders, jsonHeaders };

/**
 * Login administrateur (sans déconnexion auto sur 401).
 */
export const loginAdministrateur = async (login, password) => {
    const res = await fetch(LOGIN_ADMIN_URL, {
        method: 'POST',
        headers: jsonHeaders(),
        body: JSON.stringify({ login, password })
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
        return { success: false, message: data?.message || 'Identifiants incorrects', ...data };
    }
    return data;
};

/** Crée un nouvel administrateur (Bearer requis). */
export const createAdministrateur = async (token, payload) => (
    apiPost(CREATE_ADMIN_URL, token, payload)
);

/** Liste les administrateurs avec filtre optionnel isActive. */
export const listAdministrateurs = async (token, params = {}) => {
    const qs = new URLSearchParams(params).toString();
    const url = qs ? `${LIST_ADMINS_URL}?${qs}` : LIST_ADMINS_URL;
    return apiGet(url, token);
};

/** Récupère le profil de l'administrateur connecté. */
export const getAdministrateurMe = async (token) => apiGet(ADMIN_ME_URL, token);

/** Récupère le détail d'un administrateur par ID. */
export const getAdministrateur = async (token, id) => apiGet(getAdminDetailUrl(id), token);

/** Met à jour le profil connecté (PUT /administrateurs/me). */
export const updateAdministrateurMe = async (token, payload) => (
    apiPut(ADMIN_ME_URL, token, payload)
);

/** Met à jour un administrateur par ID. */
export const updateAdministrateur = async (token, id, payload) => (
    apiPut(updateAdminUrl(id), token, payload)
);
