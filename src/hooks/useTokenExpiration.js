import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { logOut } from '../store/actions/authentication';
import { jwtDecode } from 'jwt-decode';
import { sendToastError } from '../helpers';
import { useI18n } from '../i18n';

/**
 * Déconnecte automatiquement l'utilisateur si le token JWT est expiré.
 */
export const useTokenExpiration = () => {
    const dispatch = useDispatch();
    const token = useSelector(state => state.auth.token);
    const { t } = useI18n();
    useEffect(() => {
        const checkTokenExpiration = () => {
            if (!token) return;
            try {
                const decoded = jwtDecode(token);
                const exp = decoded?.exp;
                if (exp == null) return;
                const currentTime = Date.now() / 1000;
                if (exp < currentTime) {
                    dispatch(logOut());
                    sendToastError(t('login.sessionExpired'));
                }
            } catch {
                dispatch(logOut());
                sendToastError(t('login.tokenCheckError'));
            }
        };

        // Vérifier immédiatement
        checkTokenExpiration();

        // Vérifier toutes les minutes
        const interval = setInterval(checkTokenExpiration, 60000);

        // Nettoyer l'intervalle lors du démontage du composant
        return () => clearInterval(interval);
    }, [dispatch, t, token]);
};