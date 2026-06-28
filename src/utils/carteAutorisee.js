/** Longueur obligatoire d'un numéro de carte autorisée. */
export const CARD_NUMBER_LENGTH = 16;

/** Format accepté : 16 caractères, chiffres ou X (masque). */
const CARD_NUMBER_PATTERN = /^[0-9X]{16}$/;

/**
 * Normalise un numéro de carte (trim, suppression espaces/tirets, X en majuscule).
 */
export const normalizeCardNumber = (raw) => (
    String(raw ?? '')
        .trim()
        .replace(/[\s-]/g, '')
        .toUpperCase()
);

/**
 * Vérifie qu'un numéro respecte le format 16 positions (ex. 433339XXXXXX3509).
 */
export const isValidCardNumber = (raw) => {
    const normalized = normalizeCardNumber(raw);
    return normalized.length === CARD_NUMBER_LENGTH && CARD_NUMBER_PATTERN.test(normalized);
};

/**
 * Extrait les numéros saisis puis les valide/normalise pour l'enregistrement bulk.
 */
export const parseAndValidateCardsInput = (raw) => {
    const entries = String(raw ?? '')
        .split(/[\r\n,;\t]+/)
        .map((x) => x.trim())
        .filter(Boolean);

    const valid = [];
    const invalid = [];

    entries.forEach((entry) => {
        const normalized = normalizeCardNumber(entry);
        if (isValidCardNumber(entry)) {
            if (!valid.includes(normalized)) valid.push(normalized);
        } else {
            invalid.push(entry);
        }
    });

    return { valid, invalid };
};
