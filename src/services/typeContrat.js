import {
    getGroupeAdminTypesContratUrl,
    getGroupePartnerTypesContratUrl,
    getTypeContratUrl,
    getTypesContratUrl
} from '../config/urls/typeContrat';
import { apiDelete, apiGet, apiPostForm, apiPut, apiPutForm } from '../utils/apiClient';

/** Construit un FormData pour créer ou mettre à jour un type de contrat. */
const buildTypeContratFormData = ({ code, libelle, isActive, pdfFile }) => {
    const formData = new FormData();
    if (code != null && code !== '') formData.append('code', code);
    if (libelle != null) formData.append('libelle', libelle);
    if (isActive != null) formData.append('isActive', String(isActive));
    if (pdfFile) formData.append('pdf', pdfFile);
    return formData;
};

/** Liste tous les types de contrat actifs. */
export const listTypesContrat = async (token, params = {}) => {
    const qs = new URLSearchParams(params).toString();
    const url = qs ? `${getTypesContratUrl()}?${qs}` : getTypesContratUrl();
    return apiGet(url, token);
};

/** Types de contrat autorisés pour un groupe (agent / partner). */
export const listGroupePartnerTypesContrat = async (token, groupeId) => (
    apiGet(getGroupePartnerTypesContratUrl(groupeId), token)
);

/** Types de contrat autorisés pour un groupe (admin). */
export const getGroupTypesContrat = async (token, groupeId) => (
    apiGet(getGroupeAdminTypesContratUrl(groupeId), token)
);

/** Définit les types autorisés pour un groupe (tableau vide = tous). */
export const setGroupTypesContrat = async (token, groupeId, typeContratIds) => (
    apiPut(getGroupeAdminTypesContratUrl(groupeId), token, { typeContratIds })
);

/** Crée un type de contrat (multipart avec fichier PDF). */
export const createTypeContrat = async (token, payload) => (
    apiPostForm(getTypesContratUrl(), token, buildTypeContratFormData(payload))
);

/** Met à jour un type de contrat (PDF optionnel). */
export const updateTypeContrat = async (token, id, payload) => (
    apiPutForm(getTypeContratUrl(id), token, buildTypeContratFormData(payload))
);

/** Supprime un type de contrat. */
export const deleteTypeContrat = async (token, id) => (
    apiDelete(getTypeContratUrl(id), token)
);
