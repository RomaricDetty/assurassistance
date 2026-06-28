import React from 'react';

const LOADER_SIZES = {
    sm: { dimension: '1.25rem', borderWidth: '0.15em' },
    md: { dimension: '2.25rem', borderWidth: '0.2em' }
};

/**
 * Indicateur de chargement compact (spinner Bootstrap, couleur primary).
 */
export const Loader = ({ size = 'md', className = '' }) => {
    const { dimension, borderWidth } = LOADER_SIZES[size] || LOADER_SIZES.md;

    return (
        <div
            className={`spinner-border text-primary${className ? ` ${className}` : ''}`}
            role="status"
            style={{ width: dimension, height: dimension, borderWidth }}
        >
            <span className="visually-hidden">Loading...</span>
        </div>
    );
};

/**
 * Conteneur centré pour afficher le loader dans une page ou une section.
 */
export const LoaderContainer = ({ size = 'md', className = '' }) => (
    <div
        className={`d-flex justify-content-center align-items-center${className?.includes('compact') ? ' py-3' : ' py-4'}`}
        style={{ minHeight: className?.includes('compact') ? 72 : 120 }}
    >
        <Loader size={size} />
    </div>
);
