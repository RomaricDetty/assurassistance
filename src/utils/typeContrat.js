import { BASE_URL } from '../config/urls/base';

/** Styles de cartes tableau de bord (rotation par index). */
export const TYPE_CARD_STYLES = [
    { icon: 'iconoir-bag', color: '#e4590f', bgLight: 'rgba(228, 89, 15, 0.08)' },
    { icon: 'iconoir-star', color: '#0da684', bgLight: 'rgba(13, 166, 132, 0.08)' },
    { icon: 'iconoir-medal', color: '#2c7be5', bgLight: 'rgba(44, 123, 229, 0.08)' },
    { icon: 'iconoir-diamond', color: '#6f42c1', bgLight: 'rgba(111, 66, 193, 0.08)' },
    { icon: 'iconoir-shield', color: '#495057', bgLight: 'rgba(73, 80, 87, 0.08)' }
];

/**
 * Retourne le style visuel d'un type pour le tableau de bord.
 */
export const getTypeCardStyle = (index) => TYPE_CARD_STYLES[index % TYPE_CARD_STYLES.length];

/**
 * Résout l'URL complète d'un PDF de contrat.
 */
export const resolvePdfUrl = (typeOrPath) => {
    if (!typeOrPath) return null;
    const path = typeof typeOrPath === 'string'
        ? typeOrPath
        : (typeOrPath.pdfUrl || typeOrPath.pdfPath);
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `${BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
};

/**
 * Extrait le code du type de contrat d'un client API.
 */
export const getClientTypeCode = (client) => {
    if (client?.typeContrat?.code) return client.typeContrat.code;
    if (client?.typeContratCode) return client.typeContratCode;
    if (typeof client?.typeContrat === 'string') return client.typeContrat;
    return '';
};

/**
 * Extrait l'id du type de contrat d'un client API.
 */
export const getClientTypeContratId = (client) => (
    client?.typeContratId ?? client?.typeContrat?.id ?? null
);

/**
 * Libellé affichable d'un type de contrat.
 */
export const getTypeContratLabel = (typeOrClient) => {
    if (!typeOrClient) return '';
    if (typeOrClient.typeContrat) {
        return getTypeContratLabel(typeOrClient.typeContrat);
    }
    return typeOrClient.libelle || typeOrClient.code || '';
};

/**
 * Options pour les listes déroulantes.
 */
export const toSelectOptions = (types = []) => (
    types.map((t) => ({
        value: t.id,
        label: t.libelle || t.code,
        code: t.code,
        pdfUrl: resolvePdfUrl(t)
    }))
);

/**
 * Trouve un type par code (insensible à la casse).
 */
export const findTypeByCode = (types, code) => {
    const normalized = String(code ?? '').trim().toLowerCase();
    if (!normalized) return null;
    return types.find((t) => String(t.code ?? '').toLowerCase() === normalized) || null;
};

/**
 * Trouve un type par id.
 */
export const findTypeById = (types, id) => types.find((t) => t.id === id) || null;

/**
 * Résout un type depuis une valeur Excel (code ou libellé).
 */
export const resolveTypeFromExcel = (types, raw) => {
    const value = String(raw ?? '').trim();
    if (!value) return types[0] || null;
    return findTypeByCode(types, value)
        || types.find((t) => String(t.libelle ?? '').toLowerCase() === value.toLowerCase())
        || types[0]
        || null;
};

/**
 * Construit le payload client pour l'API à partir d'un typeContratId.
 */
export const buildClientPayload = ({ nomClient, prenomClient, idCarteBancaire, typeContratId, typeContratCode }, types = []) => {
    const payload = {
        nomClient,
        prenomClient,
        idCarteBancaire
    };
    if (typeContratId) {
        payload.typeContratId = typeContratId;
        return payload;
    }
    const type = findTypeByCode(types, typeContratCode);
    if (type?.id) payload.typeContratId = type.id;
    else if (typeContratCode) payload.typeContrat = typeContratCode;
    return payload;
};

/**
 * Données PDF à partir d'un client ou d'un formulaire.
 */
export const toPdfData = (source, types = []) => {
    const type = source.typeContrat && typeof source.typeContrat === 'object'
        ? source.typeContrat
        : findTypeById(types, source.typeContratId) || findTypeByCode(types, source.typeContrat);
    const code = type?.code || getClientTypeCode(source) || source.typeContrat || '';
    return {
        prenom: source.prenomClient ?? source.prenom ?? '',
        nom: source.nomClient ?? source.nom ?? '',
        idCarte: source.idCarteBancaire ?? source.idCarte ?? '',
        typeContrat: code,
        typeContratId: type?.id || source.typeContratId || getClientTypeContratId(source)
    };
};

/**
 * Charge en cache les templates PDF pour une liste de types.
 */
export const buildPdfTemplateCache = async (types = []) => {
    const cache = new Map();
    for (const type of types) {
        const url = resolvePdfUrl(type);
        if (!url) continue;
        try {
            const res = await fetch(url);
            if (!res.ok) continue;
            const buffer = await res.arrayBuffer();
            cache.set(type.id, buffer);
            cache.set(type.code, buffer);
        } catch {
            /* ignorer */
        }
    }
    return cache;
};

/**
 * Récupère un template PDF depuis le cache.
 */
export const getTemplateFromCache = (cache, pdfData) => {
    if (!cache || !pdfData) return null;
    return cache.get(pdfData.typeContratId) || cache.get(pdfData.typeContrat) || null;
};

/**
 * URL du template PDF pour un type ou un client.
 */
export const getTemplateUrl = (source, types = []) => {
    if (source?.pdfPath || source?.pdfUrl) {
        return resolvePdfUrl(source);
    }
    const type = typeof source === 'object'
        ? (source.typeContrat && typeof source.typeContrat === 'object'
            ? source.typeContrat
            : findTypeById(types, source.typeContratId) || findTypeByCode(types, getClientTypeCode(source)))
        : findTypeByCode(types, source);
    return resolvePdfUrl(type);
};
