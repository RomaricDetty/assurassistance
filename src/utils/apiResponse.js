/**
 * Extrait une liste depuis plusieurs formats de réponses API.
 */
export const extractList = (res, fallbackKeys = []) => {
    if (Array.isArray(res?.data)) return res.data;
    for (const key of fallbackKeys) {
        const nested = res?.data?.[key];
        if (Array.isArray(nested)) return nested;
        const root = res?.[key];
        if (Array.isArray(root)) return root;
    }
    if (Array.isArray(res?.data?.data)) return res.data.data;
    return [];
};

/**
 * Détermine si une réponse API est un succès logique.
 */
export const isApiSuccess = (res) => {
    if (res?.success === false) return false;
    if (res?.success === true) return true;
    if (res?.data != null) return true;
    return res?.message == null;
};

/**
 * Extrait un message d'erreur utilisable côté UI.
 */
export const getApiErrorMessage = (error, fallbackMessage) => {
    if (error?.body?.message) return error.body.message;
    if (error?.response?.data?.message) return error.response.data.message;
    if (error?.message) return error.message;
    return fallbackMessage;
};
