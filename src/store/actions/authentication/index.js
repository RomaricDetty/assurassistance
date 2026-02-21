import { SIGN_IN_SUCCESS, LOGOUT } from '../../types/authentication';

export const logOut = () => {
    // Clear all localStorage items instead of individual keys
    localStorage.clear();
    localStorage.removeItem("persist:root");
    return {
        type: LOGOUT
    }
}

export const signInSuccess = (token, role, accountType) => {
    return {
        type: SIGN_IN_SUCCESS,
        token: token,
        role: role,
        accountType: accountType
    }
}