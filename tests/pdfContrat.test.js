import test from 'node:test';
import assert from 'node:assert/strict';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import { splitTextInTwoLines, layoutTextMaxTwoLines } from '../src/utils/pdfContrat.js';

/**
 * Vérifie que la découpe reste bornée à 2 lignes.
 */
test('splitTextInTwoLines returns max two lines', () => {
    const lines = splitTextInTwoLines('ABCDEFGHIJKLMNOPQRSTUV', 10);
    assert.equal(lines.length, 2);
});

/**
 * Vérifie la césure quand la coupure se fait au milieu d'un mot.
 */
test('splitTextInTwoLines adds hyphen when cutting a word', () => {
    const lines = splitTextInTwoLines('Yanka', 1);
    assert.deepEqual(lines, ['Y-', 'a']);
});

/**
 * Vérifie l'absence de césure quand la coupure tombe sur un espace.
 */
test('splitTextInTwoLines does not add hyphen on space boundary', () => {
    const lines = splitTextInTwoLines('Jean Paul', 5);
    assert.equal(lines[0].endsWith('-'), false);
});

/**
 * Vérifie le wrapping naturel sur 2 lignes max.
 */
test('layoutTextMaxTwoLines wraps on spaces within two lines', async () => {
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const { lines, fits } = layoutTextMaxTwoLines(
        font,
        'TRANSPORT DE MARCHANDISES',
        53,
        5
    );
    assert.ok(lines.length <= 2);
    assert.equal(fits, true);
    assert.ok(lines.join(' ').includes('TRANSPORT'));
});

/**
 * Vérifie la troncature cohérente avec ellipse sur la 2e ligne.
 */
test('layoutTextMaxTwoLines truncates last line with ellipsis', async () => {
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const { lines, fits } = layoutTextMaxTwoLines(
        font,
        'TRANSPORT DE MARCHANDISES INTERNATIONALES EXTRA LONG',
        53,
        6
    );
    assert.equal(lines.length, 2);
    assert.equal(fits, false);
    assert.ok(lines[1].endsWith('...'));
});
