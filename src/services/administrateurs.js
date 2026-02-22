import {
    LOGIN_ADMIN_URL,
    CREATE_ADMIN_URL,
    ADMIN_ME_URL,
    LIST_ADMINS_URL,
    getAdminDetailUrl,
    updateAdminUrl
} from '../config/urls/administrateurs';

/**
 * En-têtes JSON pour les requêtes API.
 */
const jsonHeaders = () => ({
    'Content-Type': 'application/json',
    'Accept': 'application/json'
});

/**
 * En-têtes avec Bearer token pour les routes protégées.
 */
export const authHeaders = (token) => ({
    ...jsonHeaders(),
    'Authorization': `Bearer ${token}`
});

/**
 * Login administrateur. Retourne { data: { token, administrateur } } en cas de succès.
 */
export const loginAdministrateur = async (login, password) => {
    const res = await fetch(LOGIN_ADMIN_URL, {
        method: 'POST',
        headers: jsonHeaders(),
        body: JSON.stringify({ login, password })
    });
    return res.json();
};

/**
 * Crée un nouvel administrateur (Bearer requis).
 */
export const createAdministrateur = async (token, payload) => {
    const res = await fetch(CREATE_ADMIN_URL, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify(payload)
    });
    return res.json();
};

/**
 * Liste les administrateurs avec filtre optionnel isActive (true/false).
 */
export const listAdministrateurs = async (token, params = {}) => {
    const qs = new URLSearchParams(params).toString();
    const url = qs ? `${LIST_ADMINS_URL}?${qs}` : LIST_ADMINS_URL;
    const res = await fetch(url, {
        method: 'GET',
        headers: authHeaders(token)
    });
    return res.json();
};

/**
 * Récupère le profil de l'administrateur connecté (token uniquement).
 */
export const getAdministrateurMe = async (token) => {
    const res = await fetch(ADMIN_ME_URL, {
        method: 'GET',
        headers: authHeaders(token)
    });
    return res.json();
};

/**
 * Récupère le détail d'un administrateur par ID.
 */
export const getAdministrateur = async (token, id) => {
    const res = await fetch(getAdminDetailUrl(id), {
        method: 'GET',
        headers: authHeaders(token)
    });
    return res.json();
};

/**
 * Met à jour un administrateur (champs optionnels: nom, prenom, email, login, password, isActive).
 */
export const updateAdministrateur = async (token, id, payload) => {
    const res = await fetch(updateAdminUrl(id), {
        method: 'PUT',
        headers: authHeaders(token),
        body: JSON.stringify(payload)
    });
    return res.json();
}
