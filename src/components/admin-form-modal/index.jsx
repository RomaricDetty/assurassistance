import React from 'react';
import { Loader } from '../loader';
import { useI18n } from '../../i18n';

/**
 * Modale de création/édition d'administrateur.
 */
export const AdminFormModal = ({
    visible,
    editingId,
    saving,
    form,
    errors,
    onClose,
    onSubmit,
    onChange
}) => {
    const { t } = useI18n();
    if (!visible) return null;

    return (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">{editingId ? t('administration.adminTypeEdit') : t('administration.adminTypeCreate')}</h5>
                        <button type="button" className="btn-close" onClick={onClose} aria-label={t('common.cancel')} />
                    </div>
                    <form onSubmit={onSubmit}>
                        <div className="modal-body">
                            {saving ? (
                                <div className="text-center py-3"><Loader /></div>
                            ) : (
                                <>
                                    <div className="mb-3">
                                        <label className="form-label">{t('administration.login')}</label>
                                        <input type="text" className={`form-control ${errors.login ? 'is-invalid' : ''}`} name="login" value={form.login} onChange={onChange} disabled={!!editingId} />
                                        {errors.login && <div className="invalid-feedback">{errors.login}</div>}
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">{t('administration.password')} {editingId && t('administration.passwordHint')}</label>
                                        <input type="password" className={`form-control ${errors.password ? 'is-invalid' : ''}`} name="password" value={form.password} onChange={onChange} />
                                        {errors.password && <div className="invalid-feedback">{errors.password}</div>}
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">{t('administration.lastName')}</label>
                                        <input type="text" className={`form-control ${errors.nom ? 'is-invalid' : ''}`} name="nom" value={form.nom} onChange={onChange} />
                                        {errors.nom && <div className="invalid-feedback">{errors.nom}</div>}
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">{t('administration.firstName')}</label>
                                        <input type="text" className={`form-control ${errors.prenom ? 'is-invalid' : ''}`} name="prenom" value={form.prenom} onChange={onChange} />
                                        {errors.prenom && <div className="invalid-feedback">{errors.prenom}</div>}
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">{t('administration.email')}</label>
                                        <input type="email" className={`form-control ${errors.email ? 'is-invalid' : ''}`} name="email" value={form.email} onChange={onChange} />
                                        {errors.email && <div className="invalid-feedback">{errors.email}</div>}
                                    </div>
                                    <div className="form-check">
                                        <input type="checkbox" className="form-check-input" name="isActive" id="adminActive" checked={form.isActive} onChange={onChange} />
                                        <label className="form-check-label" htmlFor="adminActive">{t('administration.activeLabel')}</label>
                                    </div>
                                </>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" onClick={onClose}>{t('common.cancel')}</button>
                            {!saving && (
                                <button type="submit" className="btn btn-primary">
                                    {editingId ? t('common.save') : t('common.create')}
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
