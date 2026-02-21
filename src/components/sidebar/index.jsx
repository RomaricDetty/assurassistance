import React from 'react'
import { Link, useLocation } from 'react-router';
import LogoSm from '../../assets/images/logo_assurassistance.png';
import LogoLight from '../../assets/images/logo_assurassistance.png';
import LogoDark from '../../assets/images/logo_assurassistance.png';
import Gold from '../../assets/images/extra/gold.png';
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
                        <img src={LogoSm} alt="logo-small" className="logo-sm" />
                    </span>
                    <span className={`logo-text ${isOpen ? '' : 'd-none'}`}>
                        <img src={LogoLight} alt="logo-large" className="logo-lg logo-light" />
                        <img src={LogoDark} alt="logo-large" className="logo-lg logo-dark" />
                    </span>
                </Link>
                <p className={isOpen ? '' : 'd-none'} style={{ marginBottom: '0px', marginLeft: '10px' }}> Admin - Assur'Assistance</p>
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
                                    title="Dashboard"
                                   
                                >
                                    <i className="iconoir-report-columns menu-icon"></i>
                                    <span className={isOpen ? '' : 'd-none'}>Tableau de bord</span>
                                </Link>
                            </li>
                            <li className="nav-item">
                                <Link
                                    className={`nav-link ${isActive('/partners') ? 'active' : ''}`}
                                    to="/partners"
                                    title="Partners"
                                >
                                    <i className="iconoir-group menu-icon"></i>
                                    <span className={isOpen ? '' : 'd-none'}>Partenaires</span>
                                </Link>
                            </li>
                            <li className="nav-item">
                                <a 
                                    className={`nav-link ${isParentActive(['/transactions']) ? 'active' : ''}`} 
                                    href="#sidebarTransactions" 
                                    data-bs-toggle="collapse" 
                                    role="button"
                                    aria-expanded={isParentActive(['/transactions']) ? 'true' : 'false'} 
                                    aria-controls="sidebarTransactions" 
                                    title="Transactions"
                                >
                                    <i className="iconoir-task-list menu-icon"></i>
                                    <span className={isOpen ? '' : 'd-none'}>Transactions</span>
                                  
                                </a>
                                <div className={`collapse ${isParentActive(['/transactions']) ? 'show' : ''} ${isOpen ? '' : 'd-none'}`} id="sidebarTransactions">
                                    <ul className="nav flex-column">
                                        <li className="nav-item">
                                            <Link
                                                to="/transactions/payin"
                                                    
                                                className={`nav-link ${isActive('/transactions/payin') ? 'active' : ''}`}
                                            >
                                                Paiements
                                            </Link>
                                        </li>
                                        <li className="nav-item">
                                            <Link
                                                to="/transactions/payout"
                                                    
                                                className={`nav-link ${isActive('/transactions/payout') ? 'active' : ''}`}
                                            >
                                                Transferts
                                            </Link>
                                        </li>
                                    </ul>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    )
}
