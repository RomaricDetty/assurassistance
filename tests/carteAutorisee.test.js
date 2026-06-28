import test from 'node:test';
import assert from 'node:assert/strict';
import {
    normalizeCardNumber,
    isValidCardNumber,
    parseAndValidateCardsInput
} from '../src/utils/carteAutorisee.js';

/**
 * Vérifie la normalisation des numéros de carte.
 */
test('normalizeCardNumber trims, removes spaces and uppercases X', () => {
    assert.equal(normalizeCardNumber(' 433339xxxxxx3509 '), '433339XXXXXX3509');
    assert.equal(normalizeCardNumber('4333-3935-XXXX-3509'), '43333935XXXX3509');
});

/**
 * Vérifie le format valide 16 positions avec masque X.
 */
test('isValidCardNumber accepts exactly 16 digits or X', () => {
    assert.equal(isValidCardNumber('433339XXXXXX3509'), true);
    assert.equal(isValidCardNumber('1234567890123456'), true);
    assert.equal(isValidCardNumber('12345'), false);
    assert.equal(isValidCardNumber('12345678901234567'), false);
    assert.equal(isValidCardNumber('433339XXXXXX350A'), false);
});

/**
 * Vérifie le parsing bulk avec dédoublonnage et rejet des invalides.
 */
test('parseAndValidateCardsInput splits and validates entries', () => {
    const result = parseAndValidateCardsInput('433339XXXXXX3509\n1234567890123456\n123\n433339xxxxxx3509');
    assert.deepEqual(result.valid, ['433339XXXXXX3509', '1234567890123456']);
    assert.deepEqual(result.invalid, ['123']);
});
