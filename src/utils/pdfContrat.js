import { PDFDocument, StandardFonts } from 'pdf-lib';

/** Types de contrat et noms des fichiers template dans public/contrats/ */
export const TYPES_CONTRAT = [
    { value: 'Business', label: 'Business' },
    { value: 'Premier', label: 'Premier' },
    { value: 'Platinum', label: 'Platinum' }
];

/**
 * Mapping des champs vers les noms possibles dans les PDF (AcroForm).
 * Seuls Prénoms, Nom et ID / N° de carte sont pré-remplis.
 */
const FIELD_MAPPING = {
    prenom: ['Prénoms', 'Prenoms', 'prenom', 'Prenom', 'Prénom', 'prenoms', 'firstname'],
    nom: ['Nom', 'nom', 'NOM', 'nom_client', 'NomClient', 'lastname', 'nom_titulaire'],
    idCarte: ['ID / N° Carte', 'ID Carte', 'N° Carte', 'idCarte', 'numero_carte', 'NumeroCarte', 'carte', 'card_number']
};

/**
 * Récupère l'URL du template PDF selon le type de contrat.
 */
export const getTemplateUrl = (typeContrat) => {
    const name = TYPES_CONTRAT.find(t => t.value === typeContrat)?.value || typeContrat;
    return `${import.meta.env.BASE_URL || ''}contrats/${name}.pdf`;
};

/**
 * Normalise un nom de champ pour la comparaison (minuscules, sans espaces superflus).
 */
function normalizeName(str) {
    return String(str ?? '').toLowerCase().trim().replace(/\s+/g, ' ');
}

/**
 * Trouve le premier champ du formulaire PDF dont le nom correspond (exact ou contient un mot-clé).
 * Essaye d'abord la correspondance exacte, puis une correspondance "contient" pour capter
 * des noms comme "Text1.Nom" ou "Prénoms_titulaire".
 */
function findFieldByName(form, possibleNames, excludeKeywords = []) {
    const fields = form.getFields();
    for (const name of possibleNames) {
        const n = normalizeName(name);
        const field = fields.find(f => {
            const fn = normalizeName(f.getName?.() ?? f.name ?? '');
            if (!fn) return false;
            if (fn === n || fn.includes(n) || n.includes(fn)) {
                const excluded = excludeKeywords.some(kw => fn.includes(normalizeName(kw)));
                return !excluded;
            }
            return false;
        });
        if (field) return field;
    }
    // Fallback : champ dont le nom contient le premier mot-clé (ex. "nom" sans "prenom")
    const firstKey = normalizeName(possibleNames[0]);
    return fields.find(f => {
        const fn = normalizeName(f.getName?.() ?? f.name ?? '');
        if (!fn || fn.length < 2) return false;
        const hasKey = firstKey.length >= 2 && (fn.includes(firstKey) || firstKey.includes(fn));
        const excluded = excludeKeywords.some(kw => fn.includes(normalizeName(kw)));
        return hasKey && !excluded;
    }) || null;
}

/**
 * Liste tous les noms de champs du formulaire PDF (pour debug / configuration).
 * @param {ArrayBuffer} pdfBytes
 * @returns {Promise<{ names: string[], count: number }>}
 */
export async function listPdfFormFieldNames(pdfBytes) {
    const doc = await PDFDocument.load(pdfBytes);
    const names = [];
    try {
        const form = doc.getForm();
        if (form) {
            form.getFields().forEach(f => {
                const n = f.getName?.() ?? f.name ?? '';
                if (n) names.push(n);
            });
        }
    } catch (_) {
        // ignore
    }
    return { names, count: names.length };
}

/**
 * Formate une date YYYY-MM-DD en DD/MM/YYYY pour affichage dans le PDF.
 */
function formatDateForPdf(dateStr) {
    if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr || '';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
}

/**
 * Marge gauche du contenu dans les PDF (les tableaux ne commencent pas en x=0).
 * À augmenter si les données sont trop à gauche, à diminuer si trop à droite.
 */
const MARGIN_LEFT_PT = 72;

/**
 * Largeur approximative par colonne du tableau "Assuré - Titulaire de la carte" (en points).
 * Ajuster si les colonnes du PDF ont un espacement différent.
 */
const COLUMN_WIDTH_PT = 66;

/**
 * Positions (x, y) pour la 1re ligne sous "Assuré - Titulaire de la carte".
 * Seuls Prénoms, Nom, ID / N° de carte (3 colonnes).
 */
const OVERLAY_POSITIONS = {
    prenom: { x: MARGIN_LEFT_PT, y: 704 },
    nom: { x: MARGIN_LEFT_PT + COLUMN_WIDTH_PT - 5, y: 704 },
    idCarte: { x: MARGIN_LEFT_PT + (COLUMN_WIDTH_PT * 3) - 30, y: 704 }
};

const FONT_SIZE = 6;

/** Longueur max pour éviter les chevauchements dans le PDF. */
const MAX_LENGTH_BY_FIELD = {
    prenom: 14,
    nom: 12,
    idCarte: 24
};

/**
 * Dessine les données en overlay sur la première page (fallback quand pas de champs AcroForm).
 */
function drawTextOverlay(doc, data) {
    const pages = doc.getPages();
    if (pages.length === 0) return;
    const page = pages[0];
    const font = doc.embedStandardFont(StandardFonts.Helvetica);

    const values = [
        ['prenom', data.prenom || ''],
        ['nom', data.nom || ''],
        ['idCarte', data.idCarte || '']
    ];

    for (const [key, value] of values) {
        const pos = OVERLAY_POSITIONS[key];
        if (!pos || value === '') continue;
        const maxLen = MAX_LENGTH_BY_FIELD[key] ?? 25;
        const text = String(value).trim().substring(0, maxLen);
        page.drawText(text, {
            x: pos.x,
            y: pos.y,
            size: FONT_SIZE,
            font
        });
    }
}

/**
 * Pré-remplit un PDF avec Prénoms, Nom, ID / N° de carte.
 * @param {ArrayBuffer} pdfBytes - Contenu binaire du template PDF
 * @param {Object} data - { prenom, nom, idCarte }
 * @returns {Promise<Uint8Array>}
 */
export async function fillPdfContrat(pdfBytes, data) {
    const doc = await PDFDocument.load(pdfBytes);
    let formFilled = false;

    try {
        const form = doc.getForm();
        if (form && form.getFields().length > 0) {
            const entries = [
                ['prenom', data.prenom, []],
                ['nom', data.nom, ['prenom', 'prénom', 'prénoms']],
                ['idCarte', data.idCarte, []]
            ];

            for (const [key, value, excludeKeywords] of entries) {
                if (value == null || value === '') continue;
                const possibleNames = FIELD_MAPPING[key];
                if (!possibleNames) continue;
                const field = findFieldByName(form, possibleNames, excludeKeywords || []);
                if (field) {
                    if (field.constructor.name === 'PDFTextField') {
                        field.setText(String(value));
                        formFilled = true;
                    }
                    if (field.constructor.name === 'PDFCheckBox' && (value === '1' || value === 'Oui' || value === 'X' || value === 'x')) {
                        field.check();
                    }
                }
            }
        }
    } catch (_) {
        // ignore
    }

    // Overlay de texte pour que les données apparaissent même sans champs formulaire (ou en complément)
    drawTextOverlay(doc, data);

    return doc.save();
}

/**
 * Génère un nom de fichier pour le contrat : Nom_Prenom_TypeContrat.pdf
 */
export function getContratFileName(data) {
    const nom = (data.nom || 'Client').replace(/\s+/g, '_');
    const prenom = (data.prenom || '').replace(/\s+/g, '_');
    const type = data.typeContrat || 'Contrat';
    return `${nom}_${prenom}_${type}.pdf`.replace(/_+/g, '_');
}

/**
 * Télécharge un blob en fichier côté client.
 */
export function downloadBlob(blob, fileName) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
}
