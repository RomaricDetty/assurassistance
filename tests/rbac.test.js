import test from 'node:test';
import assert from 'node:assert/strict';
import {
    hasRouteAccess,
    getDefaultRoute,
    isSuperAdminRole,
    DEFAULT_AGENT_PATHS
} from '../src/utils/rbac.js';

test('isSuperAdminRole detects super admin', () => {
    assert.equal(isSuperAdminRole('SUPER_ADMIN'), true);
    assert.equal(isSuperAdminRole('super_admin'), true);
    assert.equal(isSuperAdminRole('AGENT'), false);
});

test('hasRouteAccess fail-closed for agent without links', () => {
    const auth = { role: 'AGENT', interfaceLinks: [] };
    assert.equal(hasRouteAccess('/contrats-clients', auth), true);
    assert.equal(hasRouteAccess('/profile', auth), true);
    assert.equal(hasRouteAccess('/', auth), false);
    assert.equal(hasRouteAccess('/clients', auth), false);
    assert.equal(hasRouteAccess('/administration', auth), false);
    assert.deepEqual(DEFAULT_AGENT_PATHS, ['/contrats-clients', '/profile']);
});

test('hasRouteAccess respects interfaceLinks for agents', () => {
    const auth = { role: 'AGENT', interfaceLinks: ['/clients', '/contrats-clients'] };
    assert.equal(hasRouteAccess('/clients', auth), true);
    assert.equal(hasRouteAccess('/administration', auth), false);
    assert.equal(hasRouteAccess('/administration/groupes-agents', auth), false);
});

test('hasRouteAccess groupes-agents requires administration link', () => {
    const auth = { role: 'AGENT', interfaceLinks: ['/administration'] };
    assert.equal(hasRouteAccess('/administration/groupes-agents', auth), true);
});

test('hasRouteAccess grants all routes to super admin', () => {
    const auth = { role: 'SUPER_ADMIN', interfaceLinks: [] };
    assert.equal(hasRouteAccess('/', auth), true);
    assert.equal(hasRouteAccess('/administration', auth), true);
});

test('getDefaultRoute picks first accessible path', () => {
    assert.equal(getDefaultRoute({ role: 'AGENT', interfaceLinks: [] }), '/contrats-clients');
    assert.equal(getDefaultRoute({ role: 'AGENT', interfaceLinks: ['/clients'] }), '/clients');
    assert.equal(getDefaultRoute({ role: 'SUPER_ADMIN', interfaceLinks: [] }), '/');
});
