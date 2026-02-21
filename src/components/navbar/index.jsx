import React, { useState, useEffect } from 'react'
import { jwtDecode } from 'jwt-decode';
import {validateAndCleanImageUrl} from '../../utils';
import { Link } from 'react-router';
import Avatar from '../../assets/images/avatar.png';
import { useDispatch, useSelector } from 'react-redux';
import { logOut } from '../../store/actions/authentication';

export const Navbar = ({ onToggleSidebar }) => {
    const dispatch = useDispatch();
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    // const token = useSelector(state => state.auth.token);
    // const decoded = jwtDecode(token);
    const [isDarkMode, setIsDarkMode] = useState(false);

    const toggleTheme = () => {
        setIsDarkMode(prevMode => {
            const newMode = !prevMode;

            // Appliquer le thème au document
            if (newMode) {
                document.documentElement.setAttribute('data-bs-theme', 'dark');
                localStorage.setItem('theme', 'dark');
            } else {
                document.documentElement.setAttribute('data-bs-theme', 'light');
                localStorage.setItem('theme', 'light');
            }

            return newMode;
        });
    };

    useEffect(() => {
        // Charger le thème sauvegardé ou utiliser la préférence système
        const savedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

        const shouldBeDark = savedTheme === 'dark' || (!savedTheme && prefersDark);

        setIsDarkMode(shouldBeDark);

        if (shouldBeDark) {
            document.documentElement.setAttribute('data-bs-theme', 'dark');
        } else {
            document.documentElement.setAttribute('data-bs-theme', 'light');
        }
    }, []);

    const handleLogout = () => {
        dispatch(logOut());
        setShowLogoutModal(false);
    }

    const openLogoutModal = (e) => {
        e.preventDefault();
        setShowLogoutModal(true);
    }

    const closeLogoutModal = () => {
        setShowLogoutModal(false);
    }

    return (
        <>
            <div className="topbar d-print-none">
                <div className="container-fluid">
                    <nav className="topbar-custom d-flex justify-content-between" id="topbar-custom">
                        <ul className="topbar-item list-unstyled d-inline-flex align-items-center mb-0">
                            <li>
                                <button
                                    className="nav-link nav-icon"
                                    id="togglemenu"
                                    onClick={onToggleSidebar}
                                >
                                    <i className="iconoir-menu"></i>
                                </button>
                            </li>
                            
                        </ul>

                        <ul className="topbar-item list-unstyled d-inline-flex align-items-center mb-0">
                            

                            <li className="topbar-item">
                                <button
                                    className="nav-link nav-icon"
                                    onClick={toggleTheme}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                                    title={isDarkMode ? 'Passer en mode clair' : 'Passer en mode sombre'}
                                >
                                    {isDarkMode ? (
                                        <i className="iconoir-sun-light" style={{ fontSize: '20px' }}></i>
                                    ) : (
                                        <i className="iconoir-half-moon" style={{ fontSize: '20px' }}></i>
                                    )}
                                </button>
                            </li>


                            <li className="dropdown topbar-item">
                                <a className="nav-link dropdown-toggle arrow-none nav-icon" data-bs-toggle="dropdown" href="#" role="button"
                                    aria-haspopup="false" aria-expanded="false" data-bs-offset="0,19">
                                    {/* <img src={validateAndCleanImageUrl(decoded.partnerData?.logo, Avatar)} alt="" className="thumb-md rounded-circle" /> */}
                                    <img src={Avatar} alt="" className="thumb-md rounded-circle" />
                                </a>
                                <div className="dropdown-menu dropdown-menu-end py-0">
                                    <div className="d-flex align-items-center dropdown-item py-2 bg-secondary-subtle">
                                        <div className="flex-shrink-0">
                                            {/* <img src={validateAndCleanImageUrl(decoded.partnerData?.logo, Avatar)} alt="" className="thumb-md rounded-circle" /> */}
                                        </div>
                                        <div className="flex-grow-1 ms-2 text-truncate align-self-center">
                                            <h6 className="my-0 fw-medium text-dark fs-13">
                                                {/* {decoded.partnerData?.firstname} {decoded.partnerData?.lastname} */}
                                                Detty Romaric
                                            </h6>
                                            <small className="text-muted mb-0">Administrateur - Assur'Assistance</small>
                                        </div>
                                    </div>
                                    <div className="dropdown-divider mt-0"></div>
                                    <small className="text-muted px-2 pb-1 d-block">Compte</small>
                                    <Link to="/profile" className="dropdown-item"><i className="las la-user fs-18 me-1 align-text-bottom"></i> Profil</Link>
                                    
                                    <div className="dropdown-divider mb-0"></div>
                                    <a className="dropdown-item text-danger" href="#" onClick={openLogoutModal}>
                                        <i className="las la-power-off fs-18 me-1 align-text-bottom"></i> Déconnexion
                                    </a>
                                </div>
                            </li>
                        </ul>
                    </nav>
                </div>
            </div>

            {/* Modal de confirmation de déconnexion */}
            {showLogoutModal && (
                <>
                    <div className="modal fade show d-block" tabIndex="-1" role="dialog">
                        <div className="modal-dialog modal-dialog-centered" role="document">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title">Confirmation de déconnexion</h5>
                                    <button type="button" className="btn-close" onClick={closeLogoutModal} aria-label="Close"></button>
                                </div>
                                <div className="modal-body">
                                    <p>Êtes-vous sûr de vouloir vous déconnecter ?</p>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={closeLogoutModal}>
                                        Annuler
                                    </button>
                                    <button type="button" className="btn btn-danger" onClick={handleLogout}>
                                        Se déconnecter
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="modal-backdrop fade show"></div>
                </>
            )}
        </>
    )
}
