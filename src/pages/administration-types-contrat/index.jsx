import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { Layout } from '../../components/layout';
import { Footer } from '../../components/footer';
import { LoaderContainer } from '../../components/loader';
import { PageHeader } from '../../components/page-header';
import {
    createTypeContrat,
    deleteTypeContrat,
    listTypesContrat,
    updateTypeContrat
} from '../../services/typeContrat';
import { sendToastError, sendToastSuccess } from '../../helpers';
import { useI18n } from '../../i18n';
import { extractList, getApiErrorMessage, isApiSuccess } from '../../utils/apiResponse';
import { resolvePdfUrl } from '../../utils/typeContrat';

const INITIAL_FORM = {
    code: '',
    libelle: '',
    isActive: true
};

/** Extrait le nom de fichier affichable depuis un chemin PDF. */
const getPdfDisplayName = (path) => {
    if (!path) return '';
    const parts = String(path).split('/');
    return parts[parts.length - 1] || path;
};

/**
 * Page d'administration des types de contrat (SUPER_ADMIN).
 */
export const AdministrationTypesContrat = () => {
    const { t } = useI18n();
    const token = useSelector((s) => s.auth.token);
    const [types, setTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(INITIAL_FORM);
    const [pdfFile, setPdfFile] = useState(null);
    const [currentPdfPath, setCurrentPdfPath] = useState('');
    const pdfInputRef = useRef(null);
    const [saving, setSaving] = useState(false);
    const [typeToDelete, setTypeToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);

    /** Charge la liste des types de contrat. */
    const fetchTypes = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const res = await listTypesContrat(token);
            setTypes(extractList(res, ['typesContrat', 'types']));
        } catch (err) {
            sendToastError(getApiErrorMessage(err, t('contractTypes.loadError')));
            setTypes([]);
        } finally {
            setLoading(false);
        }
    }, [t, token]);

    useEffect(() => {
        fetchTypes();
    }, [fetchTypes]);

    /** Ouvre la modale de création. */
    const openCreate = () => {
        setEditingId(null);
        setForm(INITIAL_FORM);
        setPdfFile(null);
        setCurrentPdfPath('');
        if (pdfInputRef.current) pdfInputRef.current.value = '';
        setShowModal(true);
    };

    /** Ouvre la modale d'édition. */
    const openEdit = (type) => {
        setEditingId(type.id);
        setForm({
            code: type.code ?? '',
            libelle: type.libelle ?? '',
            isActive: type.isActive !== false
        });
        setPdfFile(null);
        setCurrentPdfPath(type.pdfPath ?? type.pdfUrl ?? '');
        if (pdfInputRef.current) pdfInputRef.current.value = '';
        setShowModal(true);
    };

    /** Ferme la modale. */
    const closeModal = () => {
        setShowModal(false);
        setEditingId(null);
        setForm(INITIAL_FORM);
        setPdfFile(null);
        setCurrentPdfPath('');
        if (pdfInputRef.current) pdfInputRef.current.value = '';
    };

    /** Gère la sélection d'un fichier PDF local. */
    const handlePdfFileChange = (e) => {
        const file = e.target.files?.[0] ?? null;
        if (file && file.type !== 'application/pdf') {
            sendToastError(t('contractTypes.pdfFileInvalid'));
            e.target.value = '';
            setPdfFile(null);
            return;
        }
        setPdfFile(file);
    };

    /** Valide le formulaire avant envoi. */
    const validateForm = () => {
        if (!form.code?.trim()) {
            sendToastError(t('contractTypes.codeRequired'));
            return false;
        }
        if (!form.libelle?.trim()) {
            sendToastError(t('contractTypes.labelRequired'));
            return false;
        }
        if (!editingId && !pdfFile) {
            sendToastError(t('contractTypes.pdfFileRequired'));
            return false;
        }
        return true;
    };

    /** Crée ou met à jour un type de contrat. */
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!token || !validateForm()) return;
        setSaving(true);
        try {
            const payload = {
                libelle: form.libelle.trim(),
                isActive: form.isActive,
                pdfFile
            };
            const res = editingId
                ? await updateTypeContrat(token, editingId, payload)
                : await createTypeContrat(token, { ...payload, code: form.code.trim() });
            if (isApiSuccess(res)) {
                sendToastSuccess(editingId ? t('contractTypes.updateSuccess') : t('contractTypes.createSuccess'));
                closeModal();
                fetchTypes();
            } else {
                sendToastError(res.message || (editingId ? t('contractTypes.updateError') : t('contractTypes.createError')));
            }
        } catch (err) {
            sendToastError(getApiErrorMessage(err, editingId ? t('contractTypes.updateError') : t('contractTypes.createError')));
        } finally {
            setSaving(false);
        }
    };

    /** Supprime un type de contrat après confirmation. */
    const handleDelete = async () => {
        if (!typeToDelete?.id || !token) return;
        setDeleting(true);
        try {
            const res = await deleteTypeContrat(token, typeToDelete.id);
            if (isApiSuccess(res)) {
                sendToastSuccess(t('contractTypes.deleteSuccess'));
                setTypeToDelete(null);
                fetchTypes();
            } else {
                sendToastError(res.message || t('contractTypes.deleteError'));
            }
        } catch (err) {
            sendToastError(getApiErrorMessage(err, t('contractTypes.deleteError')));
        } finally {
            setDeleting(false);
        }
    };

    return (
        <Layout>
            <div className="page-content">
                <div className="container-fluid">
                    <PageHeader title={t('contractTypes.title')} />
                    <div className="row">
                        <div className="col-12">
                            <div className="card">
                                <div className="card-header d-flex flex-wrap align-items-center justify-content-between gap-2">
                                    <div>
                                        <h5 className="card-title mb-0">{t('contractTypes.listTitle')}</h5>
                                        <p className="text-muted small mb-0 mt-1">{t('contractTypes.help')}</p>
                                    </div>
                                    <button type="button" className="btn btn-primary btn-sm" onClick={openCreate}>
                                        {t('contractTypes.addType')}
                                    </button>
                                </div>
                                <div className="card-body">
                                    {loading ? (
                                        <LoaderContainer />
                                    ) : (
                                        <div className="table-responsive">
                                            <table className="table table-hover mb-0">
                                                <thead>
                                                    <tr>
                                                        <th>{t('contractTypes.code')}</th>
                                                        <th>{t('contractTypes.label')}</th>
                                                        <th>{t('contractTypes.pdfPath')}</th>
                                                        <th>{t('contractTypes.active')}</th>
                                                        <th width="120">{t('contractTypes.actions')}</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {types.length === 0 ? (
                                                        <tr>
                                                            <td colSpan="5" className="text-center text-muted">{t('contractTypes.noTypes')}</td>
                                                        </tr>
                                                    ) : (
                                                        types.map((type) => {
                                                            const pdfUrl = resolvePdfUrl(type);
                                                            return (
                                                                <tr key={type.id}>
                                                                    <td><code>{type.code}</code></td>
                                                                    <td>{type.libelle || type.code}</td>
                                                                    <td className="small text-break">
                                                                        {pdfUrl ? (
                                                                            <a href={pdfUrl} target="_blank" rel="noopener noreferrer">{type.pdfPath || type.pdfUrl}</a>
                                                                        ) : (
                                                                            type.pdfPath || type.pdfUrl || '—'
                                                                        )}
                                                                    </td>
                                                                    <td>
                                                                        <span className={`badge ${type.isActive !== false ? 'bg-success-subtle text-success' : 'bg-secondary-subtle text-secondary'}`}>
                                                                            {type.isActive !== false ? t('administration.yes') : t('administration.no')}
                                                                        </span>
                                                                    </td>
                                                                    <td>
                                                                        <div className="d-flex align-items-center gap-1">
                                                                            <button
                                                                                type="button"
                                                                                className="btn btn-sm btn-outline-primary p-2"
                                                                                onClick={() => openEdit(type)}
                                                                                title={t('contractTypes.editType')}
                                                                                aria-label={t('contractTypes.editType')}
                                                                            >
                                                                                <i className="iconoir-edit" style={{ fontSize: '1rem' }} />
                                                                            </button>
                                                                            <button
                                                                                type="button"
                                                                                className="btn btn-sm btn-outline-danger p-2"
                                                                                onClick={() => setTypeToDelete(type)}
                                                                                title={t('contractTypes.deleteType')}
                                                                                aria-label={t('contractTypes.deleteType')}
                                                                            >
                                                                                <i className="iconoir-trash" style={{ fontSize: '1rem' }} />
                                                                            </button>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <Footer />
            </div>

            {showModal && (
                <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">
                                    {editingId ? t('contractTypes.editType') : t('contractTypes.addType')}
                                </h5>
                                <button type="button" className="btn-close" onClick={closeModal} aria-label={t('common.cancel')} />
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="modal-body">
                                    <div className="mb-3">
                                        <label className="form-label">{t('contractTypes.code')}</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={form.code}
                                            onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))}
                                            readOnly={Boolean(editingId)}
                                            disabled={Boolean(editingId)}
                                            placeholder="Business"
                                            required
                                        />
                                        {editingId && (
                                            <div className="form-text">{t('contractTypes.codeNotEditable')}</div>
                                        )}
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">{t('contractTypes.label')}</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={form.libelle}
                                            onChange={(e) => setForm((p) => ({ ...p, libelle: e.target.value }))}
                                            placeholder={t('contractTypes.labelPlaceholder')}
                                            required
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">{t('contractTypes.pdfFile')}</label>
                                        <input
                                            ref={pdfInputRef}
                                            type="file"
                                            className="form-control"
                                            accept=".pdf,application/pdf"
                                            onChange={handlePdfFileChange}
                                        />
                                        <div className="form-text">{t('contractTypes.pdfFileHelp')}</div>
                                        {editingId && currentPdfPath && !pdfFile && (
                                            <div className="form-text text-muted">
                                                {t('contractTypes.currentPdf', { name: getPdfDisplayName(currentPdfPath) })}
                                            </div>
                                        )}
                                        {pdfFile && (
                                            <div className="form-text text-success">
                                                {t('contractTypes.selectedPdf', { name: pdfFile.name })}
                                            </div>
                                        )}
                                    </div>
                                    <div className="form-check">
                                        <input
                                            type="checkbox"
                                            className="form-check-input"
                                            id="typeContratActive"
                                            checked={form.isActive}
                                            onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
                                        />
                                        <label className="form-check-label" htmlFor="typeContratActive">{t('contractTypes.active')}</label>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={closeModal}>{t('common.cancel')}</button>
                                    <button type="submit" className="btn btn-primary" disabled={saving}>
                                        {saving ? t('contractTypes.saving') : (editingId ? t('common.save') : t('common.create'))}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {typeToDelete && (
                <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">{t('contractTypes.deleteType')}</h5>
                                <button type="button" className="btn-close" onClick={() => setTypeToDelete(null)} aria-label={t('common.cancel')} />
                            </div>
                            <div className="modal-body">
                                <p className="mb-0">{t('contractTypes.deleteConfirm', { name: typeToDelete.libelle || typeToDelete.code })}</p>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setTypeToDelete(null)}>{t('common.cancel')}</button>
                                <button type="button" className="btn btn-danger" onClick={handleDelete} disabled={deleting}>
                                    {deleting ? t('contractTypes.deleting') : t('contractTypes.deleteAction')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
};
