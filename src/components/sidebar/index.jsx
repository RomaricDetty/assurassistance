import React from 'react'
import { Link, useLocation } from 'react-router';
import { useSelector } from 'react-redux';
import LogoMark from '../../assets/images/logo_mark.png';
import './sidebar.css';
import { useI18n } from '../../i18n';

export const Sidebar = ({ isOpen }) => {
    const { t } = useI18n();
    const location = useLocation();
    const administrateur = useSelector((s) => s.auth.administrateur);
    const role = useSelector((s) => s.auth.role);
    const isSuperAdmin = String(role || '').toUpperCase() === 'SUPER_ADMIN';
    const links = administrateur?.interfaceLinks;
    /** Indique si un item de menu est autorisé pour l'utilisateur courant. */
    const canAccess = (path) => {
        if (isSuperAdmin) return true;
        if (!Array.isArray(links) || links.length === 0) return true;
        return links.includes(path);
    };

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
                            {canAccess('/') && <li className="nav-item">
                                <Link
                                    className={`nav-link ${isActive('/') ? 'active' : ''}`}
                                    to="/"
                                    title={t('menu.dashboard')}
                                >
                                    <i className="iconoir-report-columns menu-icon"></i>
                                    <span className={isOpen ? '' : 'd-none'}>{t('menu.dashboard')}</span>
                                </Link>
                            </li>}
                            
                            {canAccess('/contrats-clients') && <li className="nav-item">
                                <Link
                                    className={`nav-link ${isActive('/contrats-clients') ? 'active' : ''}`}
                                    to="/contrats-clients"
                                    title={t('menu.contractsClients')}
                                >
                                    <i className="iconoir-page menu-icon"></i>
                                    <span className={isOpen ? '' : 'd-none'}>{t('menu.contractsClients')}</span>
                                </Link>
                            </li>}
                            {canAccess('/clients') && <li className="nav-item">
                                <Link
                                    className={`nav-link ${isActive('/clients') ? 'active' : ''}`}
                                    to="/clients"
                                    title={t('menu.clients')}
                                >
                                    <i className="iconoir-community menu-icon"></i>
                                    <span className={isOpen ? '' : 'd-none'}>{t('menu.clients')}</span>
                                </Link>
                            </li>}
                            {canAccess('/administration') && <li className="nav-item">
                                <Link
                                    className={`nav-link ${isActive('/administration') ? 'active' : ''}`}
                                    to="/administration"
                                    title={t('menu.administration')}
                                >
                                    <i className="iconoir-settings menu-icon"></i>
                                    <span className={isOpen ? '' : 'd-none'}>{t('menu.administration')}</span>
                                </Link>
                            </li>}
                            {canAccess('/administration') && <li className="nav-item">
                                <Link
                                    className={`nav-link ${isActive('/administration/groupes-agents') ? 'active' : ''}`}
                                    to="/administration/groupes-agents"
                                    title={t('menu.groupsAgents')}
                                >
                                    <i className="iconoir-group menu-icon"></i>
                                    <span className={isOpen ? '' : 'd-none'}>{t('menu.groupsAgents')}</span>
                                </Link>
                            </li>}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    )
}
