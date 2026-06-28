import React, { useState, useEffect } from 'react';
import { Navbar } from '../../components/navbar';
import { Sidebar } from '../../components/sidebar';

export const Layout = ({ children }) => {

    const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);
    const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth > 768);

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    /** Adapte sidebar et mode mobile au redimensionnement. */
    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth <= 768;
            setIsMobile(mobile);
            setSidebarOpen(!mobile);
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

            {sidebarOpen && isMobile && (
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
