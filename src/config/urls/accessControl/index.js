import { BASE_URL } from '../base';

const BASE_API = `${BASE_URL}/api`;

/** Liste paginée des clients rattachés à un groupe partenaire. */
export const getGroupePartnerClientsUrl = (groupeId) => `${BASE_API}/groupes-partner/${groupeId}/clients`;
