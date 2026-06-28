import { CREATE_CLIENT_URL, BULK_CREATE_CLIENTS_URL, LIST_CLIENTS_URL, getClientUrl } from '../config/urls/clients';
import { apiDelete, apiGet, apiPost, apiPut } from '../utils/apiClient';

/** Crée un client. */
export const createClient = async (token, payload) => apiPost(CREATE_CLIENT_URL, token, payload);

/** Crée plusieurs clients en une requête. */
export const createClientsBulk = async (token, clientsArray) => (
    apiPost(BULK_CREATE_CLIENTS_URL, token, clientsArray)
);

/** Liste les clients (paginé). */
export const listClients = async (token, params = {}) => {
    const qs = new URLSearchParams(params).toString();
    const url = qs ? `${LIST_CLIENTS_URL}?${qs}` : LIST_CLIENTS_URL;
    return apiGet(url, token);
};

/** Récupère un client par ID. */
export const getClient = async (token, id) => apiGet(getClientUrl(id), token);

/** Modifie un client. */
export const updateClient = async (token, id, payload) => apiPut(getClientUrl(id), token, payload);

/** Supprime un client. */
export const deleteClient = async (token, id) => apiDelete(getClientUrl(id), token);
