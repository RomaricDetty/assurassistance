import { useCallback, useEffect, useState } from 'react';
import { getAdministrateurMe } from '../services/administrateurs';
import { listGroupePartnerTypesContrat, listTypesContrat } from '../services/typeContrat';
import { getAgentGroupeId } from '../utils/agentClients';
import { extractList } from '../utils/apiResponse';
import { isSuperAdminRole } from '../utils/rbac';
import { toSelectOptions } from '../utils/typeContrat';

/**
 * Charge les types de contrat disponibles (admin : tous ; agent : groupe partenaire).
 */
export const useTypesContrat = ({ token, role, administrateur }) => {
    const [types, setTypes] = useState([]);
    const [allTypesAllowed, setAllTypesAllowed] = useState(true);
    const [loading, setLoading] = useState(true);

    const loadTypes = useCallback(async () => {
        if (!token) {
            setTypes([]);
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            if (isSuperAdminRole(role)) {
                const res = await listTypesContrat(token, { activeOnly: 'true' });
                setTypes(extractList(res));
                setAllTypesAllowed(true);
                return;
            }

            let admin = administrateur;
            let groupeId = getAgentGroupeId(admin);
            if (!groupeId) {
                const me = await getAdministrateurMe(token);
                admin = me?.data ?? admin;
                groupeId = getAgentGroupeId(admin);
            }
            if (!groupeId) {
                setTypes([]);
                setAllTypesAllowed(true);
                return;
            }

            const res = await listGroupePartnerTypesContrat(token, groupeId);
            setTypes(extractList(res));
            setAllTypesAllowed(res?.meta?.allTypesAllowed !== false);
        } catch {
            setTypes([]);
        } finally {
            setLoading(false);
        }
    }, [administrateur, role, token]);

    useEffect(() => {
        loadTypes();
    }, [loadTypes]);

    return {
        types,
        loading,
        allTypesAllowed,
        selectOptions: toSelectOptions(types),
        reloadTypes: loadTypes
    };
};
