/** Routes accessibles par défaut pour un agent sans liens configurés. */
export const DEFAULT_AGENT_PATHS = ['/contrats-clients', '/profile'];

/** Ordre de priorité pour la redirection après connexion. */
const ROUTE_PRIORITY = ['/', '/contrats-clients', '/clients', '/administration', '/profile'];

/**
 * Indique si le rôle correspond à un super administrateur.
 */
export const isSuperAdminRole = (role) => String(role || '').toUpperCase() === 'SUPER_ADMIN';

/**
 * Vérifie l'accès à une route (fail-closed pour les agents).
 */
export const hasRouteAccess = (path, { role, interfaceLinks } = {}) => {
    if (path === '/profile') return true;
    if (isSuperAdminRole(role)) return true;

    const links = Array.isArray(interfaceLinks) ? interfaceLinks : [];

    if (links.length === 0) {
        return DEFAULT_AGENT_PATHS.includes(path);
    }

    if (path === '/administration/groupes-agents' || path === '/administration/types-contrat') {
        return links.includes('/administration');
    }

    return links.includes(path);
};

/**
 * Retourne la première route accessible pour l'utilisateur courant.
 */
export const getDefaultRoute = ({ role, interfaceLinks } = {}) => {
    const match = ROUTE_PRIORITY.find((path) => hasRouteAccess(path, { role, interfaceLinks }));
    return match || '/profile';
};
