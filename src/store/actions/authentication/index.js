import { SIGN_IN_SUCCESS, LOGOUT } from '../../types/authentication';

export const logOut = () => {
    const theme = localStorage.getItem('theme');
    localStorage.clear();
    localStorage.removeItem("persist:root");
    if (theme) localStorage.setItem('theme', theme);
    return {
        type: LOGOUT
    }
}

/**
 * @param {string} token
 * @param {string} role
 * @param {string} accountType
 * @param {object|null} [administrateur] - Données administrateur retournées par l'API login
 */
export const signInSuccess = (token, role, accountType, administrateur = null) => {
    return {
        type: SIGN_IN_SUCCESS,
        token,
        role,
        accountType,
        administrateur
    }
}