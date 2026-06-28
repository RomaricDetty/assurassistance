import React, { useState } from 'react';

/**
 * Panneau repliable pour alléger l'affichage (listes, détails secondaires).
 */
export const CollapsiblePanel = ({ title, defaultOpen = false, children }) => {
    const [open, setOpen] = useState(defaultOpen);

    return (
        <div className="border rounded mt-3">
            <button
                type="button"
                className="w-100 btn btn-link text-decoration-none text-start px-3 py-2 d-flex justify-content-between align-items-center"
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
            >
                <span className="fw-semibold">{title}</span>
                <i className={`iconoir-nav-arrow-${open ? 'up' : 'down'}`} />
            </button>
            {open && <div className="px-3 pb-3 pt-0">{children}</div>}
        </div>
    );
};
