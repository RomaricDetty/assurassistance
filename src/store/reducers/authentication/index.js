import * as actionTypes from '../../types/authentication';

const initialState = {
    loader_signin: false,
    error: null,
    token: null,
    role: null,
    accountType: null,
    administrateur: null,
}

export const authReducer = (state = initialState, action) => {
    switch (action.type) {
        case actionTypes.LOGOUT:
            return {
                ...state,
                token: null,
                role: null,
                accountType: null,
                administrateur: null
            }
        case actionTypes.SIGN_IN_START:
            return {
                ...state,
                loader_signin: true
            }
        case actionTypes.SIGN_IN_SUCCESS:
            return {
                ...state,
                loader_signin: false,
                token: action.token,
                role: action.role,
                accountType: action.accountType,
                administrateur: action.administrateur ?? state.administrateur,
                error: null
            }
        case actionTypes.SIGN_IN_FAILED:
            return {
                ...state,
                error: action.error,
                loader_signin: false
            }
        default:
            return state
    }
}