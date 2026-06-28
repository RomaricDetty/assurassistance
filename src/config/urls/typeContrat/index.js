import { BASE_URL } from '../base';

const BASE_API = `${BASE_URL}/api`;

/** URL de base des types de contrat (SUPER_ADMIN). */
export const getTypesContratUrl = () => `${BASE_API}/types-contrat`;

/** Détail / modification / suppression d'un type de contrat. */
export const getTypeContratUrl = (id) => `${BASE_API}/types-contrat/${id}`;

/** Types autorisés pour un groupe partenaire (agents). */
export const getGroupePartnerTypesContratUrl = (groupeId) => `${BASE_API}/groupes-partner/${groupeId}/types-contrat`;

/** Types autorisés pour un groupe admin (SUPER_ADMIN). */
export const getGroupeAdminTypesContratUrl = (groupeId) => `${BASE_API}/groupes-admin/${groupeId}/types-contrat`;
