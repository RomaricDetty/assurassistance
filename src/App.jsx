import { Routes, Route, Navigate } from "react-router";
import { useSelector } from 'react-redux';
import { useTokenExpiration } from './hooks/useTokenExpiration';

import "./assets/css/bootstrap.css";
import "./assets/css/icons.css";
import "./assets/css/app.css";
import "./assets/css/style.css";
import 'react-toastify/dist/ReactToastify.css';

import { Home } from './pages/home';
import { Login } from './pages/authentication/login';
import { Partners } from './pages/partners';
import { PartnerDetails } from './pages/partners/details';
import { TransactionDetails } from './pages/transactions/details';
import { Payin } from './pages/transactions/payin';
import { Payout } from './pages/transactions/payout';
import { Profile } from './pages/profile';
import { Test } from './pages/test';


function App() {

    const token = useSelector(state => state.auth.token)
    const userRole = useSelector(state => state.auth.role)
    useTokenExpiration();

    return (
        <>
            {token && userRole === 'admin' ? (
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/partners" element={<Partners />} />
                    <Route path="/partners/details/:id" element={<PartnerDetails />} />
                    <Route path="/transactions/:tnx" element={<TransactionDetails />} />
                    <Route path="/transactions/payin" element={<Payin />} />
                    <Route path="/transactions/payout" element={<Payout />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            ) : (
                <Routes>
                    <Route path="/test" element={<Test />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
            )}
        </>

    )
}

export default App
