import { CREATE_CLIENT_URL, LIST_CLIENTS_URL, getClientUrl } from '../config/urls/clients';
import { authHeaders } from './administrateurs';

/**
 * Crée un client. Body: nomClient, prenomClient, idCarteBancaire, typeContrat (Business | Platinum | Premier).
 */
export const createClient = async (token, payload) => {
    const res = await fetch(CREATE_CLIENT_URL, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify(payload)
    });
    return res.json();
};

/**
 * Liste les clients (paginé). params: { page, limit }. Réponse : data + meta (page, limit, total, totalPages).
 */
export const listClients = async (token, params = {}) => {
    const qs = new URLSearchParams(params).toString();
    const url = qs ? `${LIST_CLIENTS_URL}?${qs}` : LIST_CLIENTS_URL;
    const res = await fetch(url, {
        method: 'GET',
        headers: authHeaders(token)
    });
    return res.json();
};

/**
 * Récupère un client par ID.
 */
export const getClient = async (token, id) => {
    const res = await fetch(getClientUrl(id), {
        method: 'GET',
        headers: authHeaders(token)
    });
    return res.json();
};

/**
 * Modifie un client. Champs optionnels: nomClient, prenomClient, idCarteBancaire, typeContrat.
 */
export const updateClient = async (token, id, payload) => {
    const res = await fetch(getClientUrl(id), {
        method: 'PUT',
        headers: authHeaders(token),
        body: JSON.stringify(payload)
    });
    return res.json();
};

/**
 * Supprime un client.
 */
export const deleteClient = async (token, id) => {
    const res = await fetch(getClientUrl(id), {
        method: 'DELETE',
        headers: authHeaders(token)
    });
    return res.json();
};
