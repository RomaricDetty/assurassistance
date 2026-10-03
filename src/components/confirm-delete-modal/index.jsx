import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useI18n } from '../../i18n';

const REQUIRED_CLICKS = 3;

/**
 * Modale de confirmation de suppression : 3 clics sur « Supprimer » avant d'exécuter l'action.
 * Pensée mobile (boutons larges, étapes très visibles). Rendue en portal pour rester centrée.
 *
 * @param {Object} props
 * @param {boolean} props.open - Affiche la modale.
 * @param {string} props.title - Titre de la modale.
 * @param {string} props.message - Message de confirmation principal.
 * @param {boolean} [props.loading] - Action en cours.
 * @param {string} [props.loadingLabel] - Libellé pendant le chargement.
 * @param {string} [props.confirmLabel] - Libellé du bouton de suppression.
 * @param {() => void} props.onCancel - Fermeture / annulation.
 * @param {() => void|Promise<void>} props.onConfirm - Action déclenchée au 3ᵉ clic.
 * @param {React.ReactNode} [props.children] - Contenu additionnel (ex. progression).
 */
export const ConfirmDeleteModal = ({
    open,
    title,
    message,
    loading = false,
    loadingLabel,
    confirmLabel,
    onCancel,
    onConfirm,
    children
}) => {
    const { t } = useI18n();
    const [clicks, setClicks] = useState(0);

    useEffect(() => {
        if (open) setClicks(0);
    }, [open]);

    useEffect(() => {
        if (!open) return undefined;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [open]);

    if (!open || typeof document === 'undefined') return null;

    const remaining = REQUIRED_CLICKS - clicks;
    const isReady = clicks >= REQUIRED_CLICKS - 1;
    const busyLabel = loadingLabel || confirmLabel || t('common.loading');

    /** Incrémente le compteur ; au 3ᵉ clic, déclenche la suppression. */
    const handleDeleteClick = () => {
        if (loading) return;
        const next = clicks + 1;
        setClicks(next);
        if (next >= REQUIRED_CLICKS) {
            onConfirm?.();
        }
    };

    /** Ferme la modale et réinitialise le compteur. */
    const handleCancel = () => {
        if (loading) return;
        setClicks(0);
        onCancel?.();
    };

    return createPortal(
        <div
            className="modal fade show d-block confirm-delete-modal"
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
        >
            <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">{title}</h5>
                        <button
                            type="button"
                            className="btn-close"
                            onClick={handleCancel}
                            disabled={loading}
                            aria-label={t('common.cancel')}
                        />
                    </div>
                    <div className="modal-body">
                        <p className="mb-3">{message}</p>
                        <div className="alert alert-warning mb-3" role="status">
                            <div className="fw-semibold mb-1">{t('common.deleteConfirmHint')}</div>
                            <div className="small mb-0">
                                {isReady && !loading
                                    ? t('common.deleteConfirmReady')
                                    : t('common.deleteConfirmStep', { current: Math.min(clicks + 1, REQUIRED_CLICKS), required: REQUIRED_CLICKS })}
                            </div>
                        </div>
                        <div className="confirm-delete-steps d-flex justify-content-center align-items-center gap-2 mb-2" aria-hidden="true">
                            {Array.from({ length: REQUIRED_CLICKS }, (_, i) => (
                                <span
                                    key={i}
                                    className={`confirm-delete-step ${i < clicks ? 'is-done' : ''} ${i === clicks && !loading ? 'is-current' : ''}`}
                                >
                                    {i + 1}
                                </span>
                            ))}
                        </div>
                        <p className="text-center text-muted small mb-0">
                            {loading
                                ? busyLabel
                                : remaining > 0
                                    ? t('common.deleteClicksRemaining', { count: remaining })
                                    : t('common.deleteConfirmReady')}
                        </p>
                        {children}
                    </div>
                    <div className="modal-footer confirm-delete-footer flex-column-reverse flex-sm-row gap-2">
                        <button
                            type="button"
                            className="btn btn-secondary w-100"
                            onClick={handleCancel}
                            disabled={loading}
                        >
                            {t('common.cancel')}
                        </button>
                        <button
                            type="button"
                            className={`btn w-100 ${isReady ? 'btn-danger' : 'btn-outline-danger'}`}
                            onClick={handleDeleteClick}
                            disabled={loading}
                            aria-label={t('common.deleteActionWithStep', { current: Math.min(clicks + 1, REQUIRED_CLICKS), required: REQUIRED_CLICKS })}
                        >
                            {loading
                                ? busyLabel
                                : t('common.deleteActionWithStep', {
                                    current: Math.min(clicks + 1, REQUIRED_CLICKS),
                                    required: REQUIRED_CLICKS
                                })}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};
