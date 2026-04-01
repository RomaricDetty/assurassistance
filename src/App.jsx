import { Routes, Route, Navigate } from "react-router";
import { useSelector } from 'react-redux';
import { useTokenExpiration } from './hooks/useTokenExpiration';

import "./assets/css/bootstrap.css";
import "./assets/css/icons.css";
import "./assets/css/app.css";
import "./assets/css/style.css";
import "./assets/css/theme-primary.css";
import "./assets/css/responsive.css";
import 'react-toastify/dist/ReactToastify.css';

import { Home } from './pages/home';
import { Login } from './pages/authentication/login';
import { Profile } from './pages/profile';
import { ContratsClients } from './pages/contrats-clients';
import { Clients } from './pages/clients';
import { Administration } from './pages/administration';
import { AdministrationGroupes } from './pages/administration-groupes';

function App() {

    const token = useSelector(state => state.auth.token);
    const administrateur = useSelector(state => state.auth.administrateur);
    const userRole = useSelector(state => state.auth.role);
    const interfaceLinks = administrateur?.interfaceLinks;
    useTokenExpiration();
    const isSuperAdmin = String(userRole || '').toUpperCase() === 'SUPER_ADMIN';
    const hasAccess = (path) => {
        if (isSuperAdmin) return true;
        if (!Array.isArray(interfaceLinks) || interfaceLinks.length === 0) return true;
        return interfaceLinks.includes(path);
    };
    const fallbackRoute = hasAccess('/') ? '/' : hasAccess('/contrats-clients') ? '/contrats-clients' : hasAccess('/clients') ? '/clients' : '/profile';

    return (
        <>
            {token ? (
                <Routes>
                    {hasAccess('/') && <Route path="/" element={<Home />} />}
                    <Route path="/profile" element={<Profile />} />
                    {hasAccess('/contrats-clients') && <Route path="/contrats-clients" element={<ContratsClients />} />}
                    {hasAccess('/clients') && <Route path="/clients" element={<Clients />} />}
                    {hasAccess('/administration') && <Route path="/administration" element={<Administration />} />}
                    {hasAccess('/administration') && <Route path="/administration/groupes-agents" element={<AdministrationGroupes />} />}
                    <Route path="*" element={<Navigate to={fallbackRoute} replace />} />
                </Routes>
            ) : (
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
            )}
        </>

    )
}

export default App
