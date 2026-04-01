import { BASE_URL } from '../config/urls/base';

const BASE_API = `${BASE_URL}/api`;

/** En-têtes JSON standards. */
const jsonHeaders = () => ({
    'Content-Type': 'application/json',
    Accept: 'application/json'
});

/** En-têtes JSON + Bearer token pour routes protégées. */
const authHeaders = (token) => ({
    ...jsonHeaders(),
    Authorization: `Bearer ${token}`
});

/** Liste les partenaires. */
export const listPartenaires = async (token) => {
    const res = await fetch(`${BASE_API}/partenaires`, {
        method: 'GET',
        headers: authHeaders(token)
    });
    return res.json();
};

/** Crée un partenaire. */
export const createPartenaire = async (token, payload) => {
    const res = await fetch(`${BASE_API}/partenaires`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify(payload)
    });
    return res.json();
};

/** Met à jour un partenaire. */
export const updatePartenaire = async (token, partenaireId, payload) => {
    const res = await fetch(`${BASE_API}/partenaires/${partenaireId}`, {
        method: 'PUT',
        headers: authHeaders(token),
        body: JSON.stringify(payload)
    });
    return res.json();
};

/** Liste les groupes d'administration. */
export const listGroupesAdmin = async (token) => {
    const res = await fetch(`${BASE_API}/groupes-admin`, {
        method: 'GET',
        headers: authHeaders(token)
    });
    return res.json();
};

/** Crée un groupe d'administration. */
export const createGroupeAdmin = async (token, payload) => {
    const res = await fetch(`${BASE_API}/groupes-admin`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify(payload)
    });
    return res.json();
};

/** Met à jour un groupe d'administration. */
export const updateGroupeAdmin = async (token, groupeId, payload) => {
    const res = await fetch(`${BASE_API}/groupes-admin/${groupeId}`, {
        method: 'PUT',
        headers: authHeaders(token),
        body: JSON.stringify(payload)
    });
    return res.json();
};

/** Liste les cartes autorisées d'un groupe. */
export const listCartesAutorisees = async (token, groupeId) => {
    const res = await fetch(`${BASE_API}/groupes-admin/${groupeId}/cartes`, {
        method: 'GET',
        headers: authHeaders(token)
    });
    return res.json();
};

/** Ajoute un lot de cartes autorisées à un groupe. */
export const addCartesAutorisees = async (token, groupeId, cartes) => {
    const res = await fetch(`${BASE_API}/groupes-admin/${groupeId}/cartes/bulk`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({ cartes })
    });
    return res.json();
};

/** Supprime un lot de cartes autorisées d'un groupe. */
export const removeCartesAutorisees = async (token, groupeId, cartes) => {
    const res = await fetch(`${BASE_API}/groupes-admin/${groupeId}/cartes/bulk`, {
        method: 'DELETE',
        headers: authHeaders(token),
        body: JSON.stringify({ cartes })
    });
    return res.json();
};

/** Crée un agent lié à un groupe admin. */
export const createAgentForGroupe = async (token, groupeId, payload) => {
    const res = await fetch(`${BASE_API}/groupes-admin/${groupeId}/agents`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify(payload)
    });
    return res.json();
};
