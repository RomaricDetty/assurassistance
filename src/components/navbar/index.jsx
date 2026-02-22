import React, { useState, useLayoutEffect, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom';
import { Link } from 'react-router';
import { useDispatch, useSelector } from 'react-redux';
import { logOut } from '../../store/actions/authentication';

export const Navbar = ({ onToggleSidebar }) => {
    const dispatch = useDispatch();
    const administrateur = useSelector(state => state.auth.administrateur);
    const displayName = administrateur ? [administrateur.prenom, administrateur.nom].filter(Boolean).join(' ') || administrateur.login : 'Administrateur';
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [dropdownStyle, setDropdownStyle] = useState({});
    const dropdownToggleRef = useRef(null);
    const dropdownMenuRef = useRef(null);

    /** Calcule la position du menu (fixe) sous le bouton. */
    const getDropdownStyle = () => {
        const rect = dropdownToggleRef.current?.getBoundingClientRect();
        if (!rect) return {};
        return {
            position: 'fixed',
            top: rect.bottom + 4,
            right: window.innerWidth - rect.right,
            left: 'auto',
            zIndex: 1050,
        };
    };

    /** À l'ouverture, positionner le menu ; mettre à jour au scroll/resize. */
    useEffect(() => {
        if (!dropdownOpen) return;
        setDropdownStyle(getDropdownStyle());
        const update = () => setDropdownStyle(getDropdownStyle());
        window.addEventListener('scroll', update, true);
        window.addEventListener('resize', update);
        return () => {
            window.removeEventListener('scroll', update, true);
            window.removeEventListener('resize', update);
        };
    }, [dropdownOpen]);

    /** Fermeture du menu au clic à l'extérieur. */
    useEffect(() => {
        if (!dropdownOpen) return;
        const handleClickOutside = (e) => {
            if (
                dropdownMenuRef.current?.contains(e.target) ||
                dropdownToggleRef.current?.contains(e.target)
            ) return;
            setDropdownOpen(false);
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [dropdownOpen]);
    // const token = useSelector(state => state.auth.token);
    // const decoded = jwtDecode(token);
    /** État initial lu depuis le localStorage ; défaut = sombre. */
    const [isDarkMode, setIsDarkMode] = useState(() => {
        if (typeof window === 'undefined') return true;
        return localStorage.getItem('theme') !== 'light';
    });

    /** Synchronise le DOM avec le thème sauvegardé (défaut sombre). */
    useLayoutEffect(() => {
        const saved = localStorage.getItem('theme');
        const dark = saved !== 'light';
        document.documentElement.setAttribute('data-bs-theme', dark ? 'dark' : 'light');
        setIsDarkMode(dark);
    }, []);

    const toggleTheme = () => {
        setIsDarkMode(prevMode => {
            const newMode = !prevMode;
            const value = newMode ? 'dark' : 'light';
            document.documentElement.setAttribute('data-bs-theme', value);
            localStorage.setItem('theme', value);
            return newMode;
        });
    };

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
            <div className="topbar d-print-none overflow-x-hidden">
                <div className="container-fluid px-2 px-sm-3">
                    <nav className="topbar-custom d-flex justify-content-between align-items-center flex-nowrap" id="topbar-custom">
                        <ul className="topbar-item list-unstyled d-inline-flex align-items-center mb-0 flex-shrink-0">
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

                        <ul className="topbar-item list-unstyled d-inline-flex align-items-center mb-0 flex-shrink-0">
                            <li className="topbar-item">
                                <button
                                    className="nav-link nav-icon"
                                    onClick={toggleTheme}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: isDarkMode ? '#fff !important' : '#000 !important' }}
                                    title={isDarkMode ? 'Passer en mode clair' : 'Passer en mode sombre'}
                                >
                                    {isDarkMode ? (
                                        <i className="iconoir-sun-light" style={{ fontSize: '20px' }}></i>
                                    ) : (
                                        <i className="iconoir-half-moon" style={{ fontSize: '20px' }}></i>
                                    )}
                                </button>
                            </li>


                            <li className="topbar-item">
                                <button
                                    ref={dropdownToggleRef}
                                    type="button"
                                    className="nav-link arrow-none nav-icon"
                                    onClick={(e) => {
                                    e.stopPropagation();
                                    if (dropdownOpen) {
                                        setDropdownOpen(false);
                                    } else {
                                        setDropdownStyle(getDropdownStyle());
                                        setDropdownOpen(true);
                                    }
                                }}
                                    aria-expanded={dropdownOpen}
                                    aria-haspopup="true"
                                >
                                    <i className="iconoir-user"></i>
                                </button>
                                {dropdownOpen && createPortal(
                                    <div
                                        ref={dropdownMenuRef}
                                        className="dropdown-menu dropdown-menu-end py-0 show"
                                        style={dropdownStyle}
                                    >
                                        <div className="d-flex align-items-center dropdown-item py-2 bg-secondary-subtle">
                                            <div className="flex-shrink-0">
                                            </div>
                                            <div className="flex-grow-1 ms-2 text-truncate align-self-center">
                                                <h6 className="my-0 fw-medium text-dark fs-13">
                                                    {displayName}
                                                </h6>
                                                <small className="text-muted mb-0">Administrateur</small>
                                            </div>
                                        </div>
                                        <div className="dropdown-divider mt-0"></div>
                                        <small className="text-muted px-2 pb-1 d-block">Compte</small>
                                        <Link to="/profile" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                                            <i className="las la-user fs-18 me-1 align-text-bottom"></i> Profil
                                        </Link>
                                        <div className="dropdown-divider mb-0"></div>
                                        <a className="dropdown-item text-danger" href="#" onClick={(e) => { e.preventDefault(); setDropdownOpen(false); openLogoutModal(e); }}>
                                            <i className="las la-power-off fs-18 me-1 align-text-bottom"></i> Déconnexion
                                        </a>
                                    </div>,
                                    document.body
                                )}
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
