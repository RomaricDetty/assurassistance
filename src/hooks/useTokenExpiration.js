import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { logOut } from '../store/actions/authentication';
import { jwtDecode } from 'jwt-decode';
import { sendToastError } from '../helpers';

export const useTokenExpiration = () => {
    const dispatch = useDispatch();
    const token = useSelector(state => state.auth.token);
    useEffect(() => {
        const checkTokenExpiration = () => {
            if (!token) return;
            try {
                const decoded = jwtDecode(token);
                const currentTime = Date.now() / 1000;
                if (decoded.exp < currentTime) {
                    dispatch(logOut());
                    sendToastError("Votre session a expiré, veuillez vous reconnecter")
                }
            } catch (error) {
                dispatch(logOut());
                sendToastError("Une erreur est survenue lors de la vérification du token, veuillez vous reconnecter")
            }
        };

        // Vérifier immédiatement
        checkTokenExpiration();

        // Vérifier toutes les minutes
        const interval = setInterval(checkTokenExpiration, 60000);

        // Nettoyer l'intervalle lors du démontage du composant
        return () => clearInterval(interval);
    }, [dispatch, token]);
};