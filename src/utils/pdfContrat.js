import {
    PDFDocument,
    StandardFonts,
    PDFName,
    PDFBool,
    PDFHexString,
    pushGraphicsState,
    popGraphicsState,
    moveTo,
    lineTo,
    closePath,
    clip,
    endPath
} from 'pdf-lib';
import { getClientTypeCode } from './typeContrat';

export { buildPdfTemplateCache, getTemplateFromCache, getTemplateUrl, resolvePdfUrl } from './typeContrat';

/**
 * Mapping des champs vers les noms possibles dans les PDF (AcroForm).
 * Seuls Prénoms, Nom et ID / N° de carte sont pré-remplis.
 */
const FIELD_MAPPING = {
    prenom: ['prenom_client', 'Prénoms', 'Prenoms', 'prenom', 'Prenom', 'Prénom', 'prenoms', 'firstname'],
    nom: ['nom_client', 'Nom', 'nom', 'NOM', 'NomClient', 'lastname', 'nom_titulaire'],
    idCarte: ['numero_carte', 'ID / N° Carte', 'ID Carte', 'N° Carte', 'idCarte', 'NumeroCarte', 'carte', 'card_number']
};

/**
 * Zones fixes de secours (si pas d'AcroForm), alignées sur Date de Naissance.
 */
const FIELD_BOXES = {
    prenom: { x: 70.71, y: 702.14, width: 55.09, height: 8.22 },
    nom: { x: 128.68, y: 702.14, width: 53.04, height: 8.22 },
    idCarte: { x: 240.51, y: 702.14, width: 86.75, height: 8.22 }
};

/** Taille max (lisible) — on descend seulement si le texte déborde. */
const FONT_SIZE_MAX = 6;

/** Taille min pour 2 lignes dans la hauteur d'origine (~8.2 pt). */
const FONT_SIZE_MIN = 3;

/** Marge intérieure horizontale dans la zone. */
const FIELD_PADDING = 2;

/** Marge de sécurité anti-clipping (le rendu AcroForm coupe trop tôt). */
const WIDTH_SAFETY = 2;

/** Espacement vertical entre 2 lignes. */
const LINE_GAP = 0.4;

/** Padding vertical interne pour éviter le débordement. */
const VERTICAL_PADDING = 0.6;

/** Clés autorisées à s'afficher sur 2 lignes. */
const TWO_LINE_KEYS = new Set(['prenom', 'nom']);

/** Ellipse ASCII (compatible Helvetica / WinAnsi). */
const ELLIPSIS = '...';

/**
 * Normalise un nom de champ pour la comparaison (minuscules, sans espaces superflus).
 */
function normalizeName(str) {
    return String(str ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Trouve le premier champ du formulaire PDF dont le nom correspond (exact ou contient un mot-clé).
 */
function findFieldByName(form, possibleNames, excludeKeywords = []) {
    const fields = form.getFields();
    for (const name of possibleNames) {
        const n = normalizeName(name);
        const exact = fields.find((f) => {
            const fn = normalizeName(f.getName?.() ?? f.name ?? '');
            if (!fn) return false;
            const excluded = excludeKeywords.some((kw) => fn.includes(normalizeName(kw)));
            return !excluded && fn === n;
        });
        if (exact) return exact;
    }
    for (const name of possibleNames) {
        const n = normalizeName(name);
        const field = fields.find((f) => {
            const fn = normalizeName(f.getName?.() ?? f.name ?? '');
            if (!fn) return false;
            if (fn === n || fn.includes(n) || n.includes(fn)) {
                const excluded = excludeKeywords.some((kw) => fn.includes(normalizeName(kw)));
                return !excluded;
            }
            return false;
        });
        if (field) return field;
    }
    return null;
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
            form.getFields().forEach((f) => {
                const n = f.getName?.() ?? f.name ?? '';
                if (n) names.push(n);
            });
        }
    } catch {
        // ignore
    }
    return { names, count: names.length };
}

/**
 * Découpe un texte en 2 lignes maximum selon une longueur de ligne donnée.
 * Conservé pour compatibilité des tests / usages existants.
 */
export function splitTextInTwoLines(value, maxLenPerLine) {
    const text = String(value ?? '').trim();
    if (!text) return [];
    const firstChunk = text.substring(0, maxLenPerLine);
    const secondLine = text.substring(maxLenPerLine, maxLenPerLine * 2);
    if (!secondLine) return [firstChunk];

    /**
     * Détecte une coupure au milieu d'un mot pour ajouter une césure visuelle.
     * Exemple : "Y|anka" devient "Y-" puis "anka".
     */
    const isWordChar = (char) => /[A-Za-zÀ-ÖØ-öø-ÿ0-9]/.test(char || '');
    const previousChar = text.charAt(maxLenPerLine - 1);
    const nextChar = text.charAt(maxLenPerLine);
    const shouldHyphenate = isWordChar(previousChar) && isWordChar(nextChar);
    const firstLine = shouldHyphenate ? `${firstChunk}-` : firstChunk;

    return [firstLine, secondLine];
}

/**
 * Normalise le texte à afficher dans une zone (une seule ligne, texte complet).
 */
function normalizeFieldText(value) {
    return String(value ?? '').trim().replace(/\s+/g, ' ');
}

/**
 * Largeur utile réelle (padding + marge anti-clipping).
 * @param {number} width
 * @returns {number}
 */
function usableTextWidth(width) {
    return Math.max(1, width - WIDTH_SAFETY);
}

/**
 * Rectangle du widget AcroForm.
 * @param {object} field
 * @returns {{ x: number, y: number, width: number, height: number } | null}
 */
function getWidgetRect(field) {
    try {
        return field.acroField.getWidgets?.()?.[0]?.getRectangle?.() ?? null;
    } catch {
        return null;
    }
}

/**
 * Supprime les apparences figées du champ (évite le texte AcroForm coupé par-dessus).
 * @param {object} field
 */
function clearFieldAppearances(field) {
    try {
        const widgets = field.acroField.getWidgets?.() || [];
        widgets.forEach((widget) => widget.dict.delete(PDFName.of('AP')));
    } catch {
        // ignore
    }
}

/**
 * Taille max pour N lignes dans une hauteur de zone donnée (sans déborder).
 * @param {number} height
 * @param {number} lineCount
 * @returns {number}
 */
function maxFontSizeForLineCount(height, lineCount) {
    const lines = Math.max(1, lineCount);
    const available = height - VERTICAL_PADDING * 2;
    const maxSize = (available - LINE_GAP * (lines - 1)) / lines;
    const stepped = Math.floor(maxSize * 4) / 4;
    return Math.min(FONT_SIZE_MAX, Math.max(FONT_SIZE_MIN, stepped));
}

/**
 * Ajoute une infobulle avec le texte complet (survol dans les lecteurs compatibles).
 * @param {object} field
 * @param {string} text
 */
function setFieldTooltip(field, text) {
    try {
        field.acroField.dict.set(PDFName.of('TU'), PDFHexString.fromText(text));
    } catch {
        // ignore
    }
}

/**
 * Tronque un texte pour qu'il tienne en largeur, avec ellipse (coupe au mot si possible).
 * @param {import('pdf-lib').PDFFont} font
 * @param {string} text
 * @param {number} maxWidth
 * @param {number} fontSize
 * @returns {string}
 */
function truncateToWidth(font, text, maxWidth, fontSize) {
    if (font.widthOfTextAtSize(text, fontSize) <= maxWidth) return text;
    if (font.widthOfTextAtSize(ELLIPSIS, fontSize) > maxWidth) return '';

    let lo = 0;
    let hi = text.length;
    while (lo < hi) {
        const mid = Math.ceil((lo + hi) / 2);
        const candidate = `${text.slice(0, mid).trimEnd()}${ELLIPSIS}`;
        if (font.widthOfTextAtSize(candidate, fontSize) <= maxWidth) lo = mid;
        else hi = mid - 1;
    }

    let cut = text.slice(0, lo).trimEnd();
    const lastSpace = cut.lastIndexOf(' ');
    if (lastSpace > Math.floor(lo * 0.45)) cut = cut.slice(0, lastSpace).trimEnd();
    return cut ? `${cut}${ELLIPSIS}` : ELLIPSIS;
}

/**
 * Dispose un texte sur 1 ou 2 lignes (retour naturel sur les espaces).
 * @param {import('pdf-lib').PDFFont} font
 * @param {string} text
 * @param {number} maxWidth
 * @param {number} fontSize
 * @returns {{ lines: string[], fits: boolean }}
 */
export function layoutTextMaxTwoLines(font, text, maxWidth, fontSize) {
    const value = normalizeFieldText(text);
    if (!value) return { lines: [], fits: true };
    if (font.widthOfTextAtSize(value, fontSize) <= maxWidth) {
        return { lines: [value], fits: true };
    }

    const words = value.split(/\s+/).filter(Boolean);
    const line1Words = [];
    let index = 0;

    while (index < words.length) {
        const trial = [...line1Words, words[index]].join(' ');
        if (font.widthOfTextAtSize(trial, fontSize) <= maxWidth) {
            line1Words.push(words[index]);
            index += 1;
        } else {
            break;
        }
    }

    if (line1Words.length === 0) {
        const line1 = truncateToWidth(font, words[0], maxWidth, fontSize);
        const rest = words.slice(1).join(' ');
        if (!rest) {
            return { lines: [line1], fits: line1 === words[0] };
        }
        if (font.widthOfTextAtSize(rest, fontSize) <= maxWidth) {
            return { lines: [line1, rest], fits: line1 === words[0] };
        }
        return {
            lines: [line1, truncateToWidth(font, rest, maxWidth, fontSize)],
            fits: false
        };
    }

    const line1 = line1Words.join(' ');
    const remaining = words.slice(index).join(' ');
    if (!remaining) return { lines: [line1], fits: true };

    if (font.widthOfTextAtSize(remaining, fontSize) <= maxWidth) {
        return { lines: [line1, remaining], fits: true };
    }

    return {
        lines: [line1, truncateToWidth(font, remaining, maxWidth, fontSize)],
        fits: false
    };
}

/**
 * Plus grande taille pour un texte sur une seule ligne.
 * @param {import('pdf-lib').PDFFont} font
 * @param {string} text
 * @param {number} maxWidth
 * @returns {number}
 */
function computeFitFontSizeSingleLine(font, text, maxWidth) {
    const width = usableTextWidth(maxWidth);
    let size = FONT_SIZE_MAX;
    while (size > FONT_SIZE_MIN && font.widthOfTextAtSize(text, size) > width) {
        size -= 0.25;
    }
    return Math.max(FONT_SIZE_MIN, size);
}

/**
 * Plus grande taille pour un texte sur 2 lignes max, sans dépasser la hauteur de zone.
 * @param {import('pdf-lib').PDFFont} font
 * @param {string} text
 * @param {number} maxWidth
 * @param {number} maxHeight
 * @returns {number}
 */
function computeFitFontSizeTwoLines(font, text, maxWidth, maxHeight) {
    const width = usableTextWidth(maxWidth);

    // 1 ligne confortable → taille haute.
    for (let size = FONT_SIZE_MAX; size >= FONT_SIZE_MIN; size -= 0.25) {
        if (font.widthOfTextAtSize(text, size) <= width) return size;
    }

    // 2 lignes dans la hauteur d'origine (pas d'agrandissement = pas de chevauchement).
    let size = maxFontSizeForLineCount(maxHeight, 2);
    while (size > FONT_SIZE_MIN) {
        if (layoutTextMaxTwoLines(font, text, width, size).fits) return size;
        size -= 0.25;
    }
    return FONT_SIZE_MIN;
}

/**
 * Taille unique pour les 3 champs (2 lignes pour Prénoms/Nom, dans la zone d'origine).
 * @param {import('pdf-lib').PDFFont} font
 * @param {Array<{ key: string, text: string, width: number, height?: number }>} items
 * @returns {number}
 */
function computeUniformFontSize(font, items) {
    if (!items.length) return FONT_SIZE_MAX;
    let size = FONT_SIZE_MAX;
    for (const { key, text, width, height = 8.22 } of items) {
        const fitted = TWO_LINE_KEYS.has(key)
            ? computeFitFontSizeTwoLines(font, text, width, height)
            : computeFitFontSizeSingleLine(font, text, width);
        size = Math.min(size, fitted);
    }
    return size;
}

/**
 * Prépare un champ AcroForm en lecture seule (valeur complète, sans apparence clippée).
 * @param {object} field
 * @param {string} value
 * @returns {boolean}
 */
function prepareReadOnlyField(field, value) {
    if (!field || typeof field.setText !== 'function') return false;
    const fullText = normalizeFieldText(value);
    if (!fullText) return false;

    if (typeof field.disableMultiline === 'function') field.disableMultiline();
    if (typeof field.disableScrolling === 'function') {
        try {
            field.disableScrolling();
        } catch {
            // ignore
        }
    }
    field.setText(fullText);
    setFieldTooltip(field, fullText);
    if (typeof field.enableReadOnly === 'function') field.enableReadOnly();
    clearFieldAppearances(field);
    return true;
}

/**
 * Dessine 1 ou 2 lignes dans la zone d'origine (clipée, sans agrandissement).
 */
function drawTextInFixedBox(page, font, text, box, fontSize, allowTwoLines) {
    const value = normalizeFieldText(text);
    if (!value || !box) return;

    const width = usableTextWidth(box.width - FIELD_PADDING);
    const { lines } = allowTwoLines
        ? layoutTextMaxTwoLines(font, value, width, fontSize)
        : {
            lines: [
                font.widthOfTextAtSize(value, fontSize) > width
                    ? truncateToWidth(font, value, width, fontSize)
                    : value
            ]
        };

    const lineCount = Math.max(1, lines.length);
    const blockHeight = fontSize * lineCount + LINE_GAP * (lineCount - 1);
    const startY = box.y + (box.height - blockHeight) / 2;

    page.pushOperators(
        pushGraphicsState(),
        moveTo(box.x, box.y),
        lineTo(box.x + box.width, box.y),
        lineTo(box.x + box.width, box.y + box.height),
        lineTo(box.x, box.y + box.height),
        closePath(),
        clip(),
        endPath()
    );

    lines.forEach((line, index) => {
        page.drawText(line, {
            x: box.x + 1,
            y: startY + (lineCount - 1 - index) * (fontSize + LINE_GAP),
            size: fontSize,
            font
        });
    });

    page.pushOperators(popGraphicsState());
}

/**
 * Overlay de secours : même police/taille ; Prénoms/Nom sur 2 lignes max.
 */
function drawTextOverlay(doc, data, font, skipKeys = new Set()) {
    const pages = doc.getPages();
    if (pages.length === 0) return;
    const page = pages[0];

    const values = [
        ['prenom', data.prenom || ''],
        ['nom', data.nom || ''],
        ['idCarte', data.idCarte || '']
    ].filter(([key, value]) => value && !skipKeys.has(key));

    const sizeItems = values.map(([key, value]) => ({
        key,
        text: normalizeFieldText(value),
        width: (FIELD_BOXES[key]?.width ?? 50) - FIELD_PADDING,
        height: FIELD_BOXES[key]?.height ?? 8.22
    }));
    const fontSize = computeUniformFontSize(font, sizeItems);

    for (const [key, value] of values) {
        drawTextInFixedBox(
            page,
            font,
            value,
            FIELD_BOXES[key],
            fontSize,
            TWO_LINE_KEYS.has(key)
        );
    }
}

/**
 * Pré-remplit un PDF avec Prénoms, Nom, ID / N° de carte
 * (lecture seule, même police/taille ; Prénoms/Nom sur 2 lignes max).
 * @param {ArrayBuffer} pdfBytes - Contenu binaire du template PDF
 * @param {Object} data - { prenom, nom, idCarte }
 * @returns {Promise<Uint8Array>}
 */
export async function fillPdfContrat(pdfBytes, data) {
    const doc = await PDFDocument.load(pdfBytes);
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const filledKeys = new Set();
    let hasAcroForm = false;

    try {
        const form = doc.getForm();
        if (form && form.getFields().length > 0) {
            hasAcroForm = true;
            const page = doc.getPages()[0];
            const entries = [
                ['prenom', data.prenom, []],
                ['nom', data.nom, ['prenom', 'prénom', 'prénoms', 'ayantdroit']],
                ['idCarte', data.idCarte, []]
            ];

            /** @type {Array<{ key: string, field: object, text: string, width: number, height: number, rect: object }>} */
            const targets = [];
            for (const [key, value, excludeKeywords] of entries) {
                if (value == null || value === '') continue;
                const possibleNames = FIELD_MAPPING[key];
                if (!possibleNames) continue;
                const field = findFieldByName(form, possibleNames, excludeKeywords || []);
                if (!field) continue;
                const text = normalizeFieldText(value);
                if (!text) continue;
                const rect = getWidgetRect(field);
                if (!rect) continue;
                targets.push({
                    key,
                    field,
                    text,
                    width: Math.max(1, rect.width - FIELD_PADDING),
                    height: rect.height,
                    rect
                });
            }

            const fontSize = computeUniformFontSize(font, targets);

            for (const { key, field, text, rect } of targets) {
                prepareReadOnlyField(field, text);
                // Dessin page maîtrisé (2 lignes / troncature) — évite le clipping AcroForm.
                drawTextInFixedBox(
                    page,
                    font,
                    text,
                    rect,
                    fontSize,
                    TWO_LINE_KEYS.has(key)
                );
                filledKeys.add(key);
            }

            // Pas de NeedAppearances : sinon le viewer redessine un texte coupé par-dessus.
            form.acroForm.dict.set(PDFName.of('NeedAppearances'), PDFBool.False);
        }
    } catch {
        hasAcroForm = false;
    }

    if (!hasAcroForm) {
        drawTextOverlay(doc, data, font, filledKeys);
    }

    return doc.save({ updateFieldAppearances: false });
}

/**
 * Génère un nom de fichier pour le contrat : Nom_Prenom_TypeContrat_NumeroCarte.pdf
 */
export function getContratFileName(data) {
    const nom = (data.nom || 'Client').replace(/\s+/g, '_');
    const prenom = (data.prenom || '').replace(/\s+/g, '_');
    const type = data.typeContrat || getClientTypeCode(data) || 'Contrat';
    const idCarte = String(data.idCarte ?? '').trim().replace(/\s+/g, '_').replace(/[\\/:*?"<>|]/g, '');
    const parts = [nom, prenom, type, idCarte].filter(Boolean);
    return `${parts.join('_')}.pdf`.replace(/_+/g, '_');
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

/** Nombre max de PDF par archive ZIP (export clients / import Excel). */
export const MAX_PDF_PER_ZIP = 1000;

/** Date du jour au format YYYY-MM-DD pour nommer les archives. */
export function getZipDateStamp() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

/**
 * Nom d'archive ZIP pour l'export de contrats clients.
 * Ex. : contrats_clients_2026-09-28.zip ou contrats_clients_2026-09-28_partie-01.zip
 */
export function getContratsClientsZipName(partIndex, totalParts, dateStamp = getZipDateStamp()) {
    if (totalParts <= 1) return `contrats_clients_${dateStamp}.zip`;
    const part = String(partIndex).padStart(2, '0');
    return `contrats_clients_${dateStamp}_partie-${part}.zip`;
}
