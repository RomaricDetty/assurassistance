/**
 * Client HTTP centralisé : parsing JSON, erreurs HTTP, déconnexion sur 401.
 */

/** Erreur API avec statut HTTP et corps de réponse. */
export class ApiError extends Error {
    constructor(message, status, body = null) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.body = body;
    }
}

let unauthorizedHandler = null;

/**
 * Enregistre le callback appelé sur 401 (session expirée / token invalide).
 */
export const setUnauthorizedHandler = (handler) => {
    unauthorizedHandler = typeof handler === 'function' ? handler : null;
};

/** En-têtes JSON standards. */
export const jsonHeaders = () => ({
    'Content-Type': 'application/json',
    Accept: 'application/json'
});

/** En-têtes JSON + Bearer token. */
export const authHeaders = (token) => ({
    ...jsonHeaders(),
    Authorization: `Bearer ${token}`
});

/** En-têtes Bearer pour envoi FormData (sans Content-Type). */
export const authHeadersForm = (token) => ({
    Accept: 'application/json',
    Authorization: `Bearer ${token}`
});

/**
 * Parse le corps JSON d'une réponse fetch (si disponible).
 */
const parseJsonBody = async (res) => {
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) return null;
    try {
        return await res.json();
    } catch {
        return null;
    }
};

/**
 * Requête fetch avec gestion d'erreur HTTP. Lance ApiError si !res.ok.
 */
export const apiFetch = async (url, options = {}) => {
    const res = await fetch(url, options);
    const data = await parseJsonBody(res);
    const hasAuth = Boolean(
        options.headers?.Authorization || options.headers?.authorization
    );

    if (res.status === 401 && hasAuth && unauthorizedHandler) {
        unauthorizedHandler();
    }

    if (!res.ok) {
        const message = data?.message || res.statusText || 'Erreur réseau';
        throw new ApiError(message, res.status, data);
    }

    return data;
};

/** GET authentifié. */
export const apiGet = (url, token) => apiFetch(url, { method: 'GET', headers: authHeaders(token) });

/** POST authentifié. */
export const apiPost = (url, token, body) => apiFetch(url, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(body)
});

/** PUT authentifié. */
export const apiPut = (url, token, body) => apiFetch(url, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify(body)
});

/** DELETE authentifié (body JSON optionnel). */
export const apiDelete = (url, token, body) => apiFetch(url, {
    method: 'DELETE',
    headers: authHeaders(token),
    ...(body != null ? { body: JSON.stringify(body) } : {})
});

/** POST multipart/form-data authentifié. */
export const apiPostForm = (url, token, formData) => apiFetch(url, {
    method: 'POST',
    headers: authHeadersForm(token),
    body: formData
});

/** PUT multipart/form-data authentifié. */
export const apiPutForm = (url, token, formData) => apiFetch(url, {
    method: 'PUT',
    headers: authHeadersForm(token),
    body: formData
});
