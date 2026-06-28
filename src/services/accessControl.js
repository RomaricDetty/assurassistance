import { BASE_URL } from '../config/urls/base';
import { getGroupePartnerClientsUrl } from '../config/urls/accessControl';
import { apiDelete, apiGet, apiPost, apiPut } from '../utils/apiClient';

const BASE_API = `${BASE_URL}/api`;

/** Liste les partenaires. */
export const listPartenaires = async (token) => apiGet(`${BASE_API}/partenaires`, token);

/** Crée un partenaire. */
export const createPartenaire = async (token, payload) => apiPost(`${BASE_API}/partenaires`, token, payload);

/** Met à jour un partenaire. */
export const updatePartenaire = async (token, partenaireId, payload) => (
    apiPut(`${BASE_API}/partenaires/${partenaireId}`, token, payload)
);

/** Liste les groupes d'administration. */
export const listGroupesAdmin = async (token) => apiGet(`${BASE_API}/groupes-admin`, token);

/** Crée un groupe d'administration. */
export const createGroupeAdmin = async (token, payload) => apiPost(`${BASE_API}/groupes-admin`, token, payload);

/** Met à jour un groupe d'administration. */
export const updateGroupeAdmin = async (token, groupeId, payload) => (
    apiPut(`${BASE_API}/groupes-admin/${groupeId}`, token, payload)
);

/** Liste les cartes autorisées d'un groupe. */
export const listCartesAutorisees = async (token, groupeId) => (
    apiGet(`${BASE_API}/groupes-admin/${groupeId}/cartes`, token)
);

/** Ajoute un lot de cartes autorisées à un groupe. */
export const addCartesAutorisees = async (token, groupeId, cartes) => (
    apiPost(`${BASE_API}/groupes-admin/${groupeId}/cartes/bulk`, token, { cartes })
);

/** Supprime un lot de cartes autorisées d'un groupe. */
export const removeCartesAutorisees = async (token, groupeId, cartes) => (
    apiDelete(`${BASE_API}/groupes-admin/${groupeId}/cartes/bulk`, token, { cartes })
);

/** Crée un agent lié à un groupe admin. */
export const createAgentForGroupe = async (token, groupeId, payload) => (
    apiPost(`${BASE_API}/groupes-admin/${groupeId}/agents`, token, payload)
);

/** Liste les clients rattachés au groupe partenaire de l'agent (paginé). */
export const listGroupePartnerClients = async (token, groupeId, params = {}) => {
    const qs = new URLSearchParams(params).toString();
    const baseUrl = getGroupePartnerClientsUrl(groupeId);
    const url = qs ? `${baseUrl}?${qs}` : baseUrl;
    return apiGet(url, token);
};

export { getGroupTypesContrat, setGroupTypesContrat } from './typeContrat';
