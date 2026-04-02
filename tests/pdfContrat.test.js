import test from 'node:test';
import assert from 'node:assert/strict';
import { splitTextInTwoLines } from '../src/utils/pdfContrat.js';

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
