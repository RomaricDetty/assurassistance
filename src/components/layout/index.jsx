import React, { useState, useEffect } from 'react';
import { Navbar } from '../../components/navbar';
import { Sidebar } from '../../components/sidebar';

export const Layout = ({ children }) => {

    // Initialiser sidebarOpen en fonction de la taille de l'écran
    const [sidebarOpen, setSidebarOpen] = useState(() => {
        return window.innerWidth > 768; // Ouvert sur desktop, fermé sur mobile
    });

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    // Gérer le redimensionnement de l'écran
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth > 768) {
                setSidebarOpen(true); // Ouvrir automatiquement sur desktop
            } else {
                setSidebarOpen(false); // Fermer automatiquement sur mobile
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

  return (
        <>
            {/* Top Bar Start */}
            <Navbar onToggleSidebar={toggleSidebar} />
            {/* Top Bar End */}

            {/* leftbar-tab-menu */}
            <Sidebar isOpen={sidebarOpen} />
            {/* end startbar */}

            {sidebarOpen && window.innerWidth <= 768 && (
                <div className="sidebar-overlay" onClick={toggleSidebar}></div>
            )}

            <div className={`page-wrapper ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
                {/* Page Content*/}
                {children}
                {/* end page content */}
            </div>
        </>
  )
}
