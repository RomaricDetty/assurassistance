import test from 'node:test';
import assert from 'node:assert/strict';
import { extractList, isApiSuccess, getApiErrorMessage } from '../src/utils/apiResponse.js';

/**
 * Vérifie l'extraction de liste sur les formats de réponse supportés.
 */
test('extractList supports multiple response shapes', () => {
    assert.deepEqual(extractList({ data: [1, 2] }), [1, 2]);
    assert.deepEqual(extractList({ data: { clients: ['a'] } }, ['clients']), ['a']);
    assert.deepEqual(extractList({ data: { data: ['x'] } }), ['x']);
    assert.deepEqual(extractList({}), []);
});

/**
 * Vérifie la détection de succès logique API.
 */
test('isApiSuccess handles success flags and payloads', () => {
    assert.equal(isApiSuccess({ success: false }), false);
    assert.equal(isApiSuccess({ data: {} }), true);
    assert.equal(isApiSuccess({ message: undefined }), true);
    assert.equal(isApiSuccess({ message: 'error' }), false);
});

/**
 * Vérifie la priorité des messages d'erreur.
 */
test('getApiErrorMessage prioritizes backend then fallback', () => {
    const backendError = { response: { data: { message: 'Backend message' } } };
    assert.equal(getApiErrorMessage(backendError, 'Fallback'), 'Backend message');
    assert.equal(getApiErrorMessage(new Error('Native error'), 'Fallback'), 'Native error');
    assert.equal(getApiErrorMessage(null, 'Fallback'), 'Fallback');
});
