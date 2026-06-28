import { Routes, Route, Navigate } from "react-router";
import { lazy, Suspense } from 'react';
import { useSelector } from 'react-redux';
import { useTokenExpiration } from './hooks/useTokenExpiration';
import { LoaderContainer } from './components/loader';
import { hasRouteAccess, getDefaultRoute } from './utils/rbac';

import "./assets/css/bootstrap.css";
import "./assets/css/icons.css";
import "./assets/css/app.css";
import "./assets/css/style.css";
import "./assets/css/theme-primary.css";
import "./assets/css/responsive.css";
import 'react-toastify/dist/ReactToastify.css';

const Home = lazy(() => import('./pages/home').then((m) => ({ default: m.Home })));
const Login = lazy(() => import('./pages/authentication/login').then((m) => ({ default: m.Login })));
const Profile = lazy(() => import('./pages/profile').then((m) => ({ default: m.Profile })));
const ContratsClients = lazy(() => import('./pages/contrats-clients').then((m) => ({ default: m.ContratsClients })));
const Clients = lazy(() => import('./pages/clients').then((m) => ({ default: m.Clients })));
const Administration = lazy(() => import('./pages/administration').then((m) => ({ default: m.Administration })));
const AdministrationGroupes = lazy(() => import('./pages/administration-groupes').then((m) => ({ default: m.AdministrationGroupes })));
const AdministrationTypesContrat = lazy(() => import('./pages/administration-types-contrat').then((m) => ({ default: m.AdministrationTypesContrat })));

function App() {

    const token = useSelector(state => state.auth.token);
    const administrateur = useSelector(state => state.auth.administrateur);
    const userRole = useSelector(state => state.auth.role);
    const interfaceLinks = administrateur?.interfaceLinks;
    useTokenExpiration();

    const authContext = { role: userRole, interfaceLinks };
    const hasAccess = (path) => hasRouteAccess(path, authContext);
    const fallbackRoute = getDefaultRoute(authContext);

    return (
        <Suspense fallback={<LoaderContainer />}>
            {token ? (
                <Routes>
                    {hasAccess('/') && <Route path="/" element={<Home />} />}
                    <Route path="/profile" element={<Profile />} />
                    {hasAccess('/contrats-clients') && <Route path="/contrats-clients" element={<ContratsClients />} />}
                    {hasAccess('/clients') && <Route path="/clients" element={<Clients />} />}
                    {hasAccess('/administration') && <Route path="/administration" element={<Administration />} />}
                    {hasAccess('/administration') && <Route path="/administration/groupes-agents" element={<AdministrationGroupes />} />}
                    {hasAccess('/administration') && <Route path="/administration/types-contrat" element={<AdministrationTypesContrat />} />}
                    <Route path="*" element={<Navigate to={fallbackRoute} replace />} />
                </Routes>
            ) : (
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
            )}
        </Suspense>
    )
}

export default App
