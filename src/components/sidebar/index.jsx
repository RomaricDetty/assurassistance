import React from 'react'
import { Link, useLocation } from 'react-router';
import LogoMark from '../../assets/images/logo_mark.png';
import './sidebar.css';

export const Sidebar = ({ isOpen }) => {
    const location = useLocation();

    // Fonction pour vérifier si le lien est actif
    const isActive = (path) => {
        return location.pathname === path;
    };

    // Fonction pour vérifier si un parent est actif (pour les sous-menus)
    const isParentActive = (paths) => {
        return paths.some(path => location.pathname.startsWith(path));
    };

    return (
        <div className={`startbar d-print-none ${isOpen ? 'sidebar-expanded' : 'sidebar-collapsed'}`} style={{zIndex: 1000}} >
            {/* start brand */}
            <div className="brand">
                <Link to="/" className="logo">
                    <span>
                        <img src={LogoMark} alt="logo-small" className="logo-sm" />
                    </span>
                    <span className={`logo-text ${isOpen ? '' : 'd-none'}`}>
                        <img src={LogoMark} alt="logo-large" className="logo-lg logo-light" />
                        <img src={LogoMark} alt="logo-large" className="logo-lg logo-dark" />
                    </span>
                </Link>
                <p className={isOpen ? '' : 'd-none'} style={{ marginBottom: '0px', marginLeft: '10px' }}> Assur'Assistance</p>
            </div>
            {/* end brand */}

            {/* start startbar-menu */}
            <div className="startbar-menu">
                <div className="startbar-collapse" id="startbarCollapse" data-simplebar>
                    <div className="d-flex align-items-start flex-column w-100">
                        {/* Navigation */}
                        <ul className="navbar-nav mb-auto w-100">
                            <li className="nav-item">
                                <Link
                                    className={`nav-link ${isActive('/') ? 'active' : ''}`}
                                    to="/"
                                    title="Tableau de bord"
                                >
                                    <i className="iconoir-report-columns menu-icon"></i>
                                    <span className={isOpen ? '' : 'd-none'}>Tableau de bord</span>
                                </Link>
                            </li>
                            
                            <li className="nav-item">
                                <Link
                                    className={`nav-link ${isActive('/contrats-clients') ? 'active' : ''}`}
                                    to="/contrats-clients"
                                    title="Contrats clients"
                                >
                                    <i className="iconoir-page menu-icon"></i>
                                    <span className={isOpen ? '' : 'd-none'}>Contrats clients</span>
                                </Link>
                            </li>
                            <li className="nav-item">
                                <Link
                                    className={`nav-link ${isActive('/clients') ? 'active' : ''}`}
                                    to="/clients"
                                    title="Clients"
                                >
                                    <i className="iconoir-community menu-icon"></i>
                                    <span className={isOpen ? '' : 'd-none'}>Clients</span>
                                </Link>
                            </li>
                            <li className="nav-item">
                                <Link
                                    className={`nav-link ${isActive('/administration') ? 'active' : ''}`}
                                    to="/administration"
                                    title="Administration"
                                >
                                    <i className="iconoir-settings menu-icon"></i>
                                    <span className={isOpen ? '' : 'd-none'}>Administration</span>
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    )
}
