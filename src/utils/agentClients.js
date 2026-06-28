/** Retourne l'identifiant du groupe admin / partenaire lié à un agent. */
export const getAgentGroupeId = (admin) => (
    admin?.groupeAdmin?.id ?? admin?.groupeAdminId ?? admin?.groupeId ?? null
);
