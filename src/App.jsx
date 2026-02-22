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

function App() {

    const token = useSelector(state => state.auth.token);
    const userRole = useSelector(state => state.auth.role);
    useTokenExpiration();

    return (
        <>
            {token && userRole === 'admin' ? (
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/contrats-clients" element={<ContratsClients />} />
                    <Route path="/clients" element={<Clients />} />
                    <Route path="/administration" element={<Administration />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
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
