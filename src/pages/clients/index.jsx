import React, { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Layout } from '../../components/layout';
import { Footer } from '../../components/footer';
import { Loader } from '../../components/loader';
import { listClients, updateClient, deleteClient } from '../../services/clients';
import { TYPES_CONTRAT, getTemplateUrl, fillPdfContrat, getContratFileName, downloadBlob } from '../../utils/pdfContrat';
import { sendToastError, sendToastSuccess } from '../../helpers';
import JSZip from 'jszip';
import { useI18n } from '../../i18n';

/** Mappe un client API vers les données attendues par fillPdfContrat. */
const normalizeTypeContrat = (raw) => {
    const value = String(raw ?? '').trim().toLowerCase();
    if (value === 'premier') return 'Premier';
    if (value === 'platinum') return 'Platinum';
    return 'Business';
};

/** Mappe un client API vers les données attendues par fillPdfContrat. */
const clientToPdfData = (c) => ({
    prenom: c.prenomClient ?? '',
    nom: c.nomClient ?? '',
    idCarte: c.idCarteBancaire ?? '',
    typeContrat: normalizeTypeContrat(c.typeContrat)
});

const DEFAULT_LIMIT = 100;

/**
 * Page Clients : liste des clients (paginée), modification, génération de contrat (par ligne ou page).
 */
export const Clients = () => {
    const { t } = useI18n();
    const token = useSelector((s) => s.auth.token);
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState({ nomClient: '', prenomClient: '', idCarteBancaire: '', typeContrat: 'Business' });
    const [saving, setSaving] = useState(false);
    const [generatingId, setGeneratingId] = useState(null);
    const [generatingAll, setGeneratingAll] = useState(false);
    /** Progression génération PDF : { current, total }. */
    const [generateProgress, setGenerateProgress] = useState(null);
    const [clientToDelete, setClientToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [selectedIds, setSelectedIds] = useState([]);
    const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
    const [deletingBulk, setDeletingBulk] = useState(false);
    /** Progression suppression en masse : { current, total }. */
    const [deleteBulkProgress, setDeleteBulkProgress] = useState(null);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(DEFAULT_LIMIT);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');

    const TYPES = [{ value: 'Business', label: 'Business' }, { value: 'Premier', label: 'Premier' }, { value: 'Platinum', label: 'Platinum' }];

    /** Filtre les clients de la page courante par prénom, nom, n° carte ou type de contrat. */
    const filteredClients = useMemo(() => {
        const t = searchTerm.trim().toLowerCase();
        if (!t) return clients;
        return clients.filter((c) =>
            (c.prenomClient ?? '').toLowerCase().includes(t) ||
            (c.nomClient ?? '').toLowerCase().includes(t) ||
            (c.idCarteBancaire ?? '').toLowerCase().includes(t) ||
            (c.typeContrat ?? '').toLowerCase().includes(t)
        );
    }, [clients, searchTerm]);

    const fetchList = async (pageNum = page, limitNum = limit) => {
        if (!token) return;
        setLoading(true);
        try {
            const res = await listClients(token, { page: pageNum, limit: limitNum });
            const list = Array.isArray(res.data) ? res.data : res.data?.clients ?? res.data?.data ?? [];
            setClients(list);
            const meta = res.meta || {};
            setTotal(meta.total ?? list.length);
            setTotalPages(meta.totalPages ?? Math.max(1, Math.ceil((meta.total ?? list.length) / (meta.limit ?? limitNum))));
        } catch (err) {
            sendToastError(t('clients.loadingListError'));
            setClients([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchList(page, limit);
    }, [token, page, limit]);

    /** Réinitialise la sélection lors du changement de page ou de limite. */
    useEffect(() => {
        setSelectedIds([]);
    }, [page, limit]);

    /** Bascule la sélection d'un client. */
    const toggleSelect = (id) => {
        setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
    };

    /** Sélectionne ou désélectionne tous les clients visibles (filtrés). */
    const toggleSelectAll = () => {
        const allSelected = filteredClients.length > 0 && selectedIds.length === filteredClients.length;
        setSelectedIds(allSelected ? [] : filteredClients.map((c) => c.id));
    };

    /** Supprime en masse les clients sélectionnés (par lots pour garder l’UI réactive : 100, 500, 1000…). */
    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;
        const ids = [...selectedIds];
        const total = ids.length;
        const DELETE_CHUNK = 50;
        setDeletingBulk(true);
        setDeleteBulkProgress({ current: 0, total });
        let done = 0;
        try {
            for (let start = 0; start < total; start += DELETE_CHUNK) {
                const chunk = ids.slice(start, start + DELETE_CHUNK);
                for (const id of chunk) {
                    const res = await deleteClient(token, id);
                    if (res.success !== false && (res.data != null || res.message === undefined)) done++;
                }
                setDeleteBulkProgress({ current: Math.min(start + DELETE_CHUNK, total), total });
                await new Promise((r) => setTimeout(r, 0));
            }
            sendToastSuccess(t('clients.bulkDeleteSuccess', { count: done }));
            setSelectedIds([]);
            setShowBulkDeleteModal(false);
            fetchList(page, limit);
        } catch (err) {
            sendToastError(t('clients.bulkDeleteError'));
        } finally {
            setDeleteBulkProgress(null);
            setDeletingBulk(false);
        }
    };

    const openEdit = (client) => {
        setEditingId(client.id);
        setForm({
            nomClient: client.nomClient ?? '',
            prenomClient: client.prenomClient ?? '',
            idCarteBancaire: client.idCarteBancaire ?? '',
            typeContrat: client.typeContrat ?? 'Business'
        });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingId(null);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!editingId) return;
        setSaving(true);
        try {
            const res = await updateClient(token, editingId, form);
            if (res.data != null || res.success) {
                sendToastSuccess(t('clients.updateSuccess'));
                closeModal();
                fetchList(page, limit);
            } else {
                sendToastError(res.message || t('clients.updateError'));
            }
        } catch (err) {
            sendToastError(t('clients.updateError'));
        } finally {
            setSaving(false);
        }
    };

    /** Génère le PDF pour un client. */
    const handleGenerateOne = async (client) => {
        setGeneratingId(client.id);
        try {
            const url = getTemplateUrl(normalizeTypeContrat(client.typeContrat));
            const res = await fetch(url);
            if (!res.ok) throw new Error(t('clients.templateNotFound'));
            const buffer = await res.arrayBuffer();
            const data = clientToPdfData(client);
            const filled = await fillPdfContrat(buffer, data);
            const blob = new Blob([filled], { type: 'application/pdf' });
            downloadBlob(blob, getContratFileName(data));
            sendToastSuccess(t('clients.contractDownloaded'));
        } catch (err) {
            sendToastError(err.message || t('clients.generateError'));
        } finally {
            setGeneratingId(null);
        }
    };

    /** Génère les PDF des clients visibles (filtrés) ou de toute la page si pas de recherche. */
    const handleGenerateAll = async () => {
        const toGenerate = filteredClients;
        if (toGenerate.length === 0) {
            sendToastError(t('clients.noClientToProcess'));
            return;
        }
        const total = toGenerate.length;
        const CHUNK_SIZE =
            total <= 500 ? 500
            : total <= 2000 ? 200
            : total <= 5000 ? 200
            : total <= 15000 ? 150
            : 100;
        const MAX_PDF_PER_ZIP = 1000;
        setGeneratingAll(true);
        setGenerateProgress({ current: 0, total });
        try {
            const templateCache = new Map();
            for (const t of TYPES_CONTRAT) {
                try {
                    const res = await fetch(getTemplateUrl(t.value));
                    if (res.ok) templateCache.set(t.value, await res.arrayBuffer());
                } catch (_) { /* ignorer */ }
            }
            const usedNames = new Set();
            const zipBlobs = [];
            let zip = new JSZip();
            let countInZip = 0;
            for (let start = 0; start < total; start += CHUNK_SIZE) {
                const end = Math.min(start + CHUNK_SIZE, total);
                const batch = toGenerate.slice(start, end);
                const results = await Promise.all(
                    batch.map(async (c) => {
                        const pdfData = clientToPdfData(c);
                        const templateBuf = templateCache.get(pdfData.typeContrat);
                        if (!templateBuf) return null;
                        const bufferCopy = templateBuf.slice(0);
                        try {
                            const filled = await fillPdfContrat(bufferCopy, pdfData);
                            return { pdfData, filled };
                        } catch (_) {
                            return null;
                        }
                    })
                );
                for (const item of results) {
                    if (!item) continue;
                    let fileName = getContratFileName(item.pdfData);
                    while (usedNames.has(fileName)) {
                        const match = fileName.match(/^(.*)_(\d+)\.pdf$/i);
                        const base = match ? match[1] : fileName.replace(/\.pdf$/i, '');
                        const num = match ? parseInt(match[2], 10) + 1 : 1;
                        fileName = `${base}_${num}.pdf`;
                    }
                    usedNames.add(fileName);
                    zip.file(fileName, item.filled, { binary: true });
                    countInZip++;
                    if (countInZip >= MAX_PDF_PER_ZIP) {
                        setGenerateProgress({ current: end, total });
                        zipBlobs.push(await zip.generateAsync({ type: 'blob' }));
                        zip = new JSZip();
                        countInZip = 0;
                        await new Promise((r) => setTimeout(r, 0));
                    }
                }
                setGenerateProgress({ current: end, total });
                await new Promise((r) => setTimeout(r, 0));
            }
            if (countInZip > 0) {
                zipBlobs.push(await zip.generateAsync({ type: 'blob' }));
            }
            const count = usedNames.size;
            if (count === 0) {
                sendToastError(t('clients.noContractGenerated'));
                return;
            }
            for (let z = 0; z < zipBlobs.length; z++) {
                downloadBlob(zipBlobs[z], zipBlobs.length > 1 ? `contrats_clients_${z + 1}.zip` : 'contrats_clients.zip');
                if (z < zipBlobs.length - 1) await new Promise((r) => setTimeout(r, 300));
            }
            sendToastSuccess(zipBlobs.length > 1
                ? t('clients.zipDoneMulti', { count, archives: zipBlobs.length })
                : t('clients.zipDoneSingle', { count }));
        } catch (err) {
            sendToastError(err.message || t('clients.generateError'));
        } finally {
            setGenerateProgress(null);
            setGeneratingAll(false);
        }
    };

    /** Supprime un client après confirmation. */
    const handleDelete = async () => {
        if (!clientToDelete) return;
        setDeleting(true);
        try {
            const res = await deleteClient(token, clientToDelete.id);
            if (res.success !== false && (res.data != null || res.message === undefined)) {
                sendToastSuccess(t('clients.clientDeleted'));
                setClientToDelete(null);
                fetchList(page, limit);
            } else {
                sendToastError(res.message || t('clients.deleteError'));
            }
        } catch (err) {
            sendToastError(t('clients.deleteError'));
        } finally {
            setDeleting(false);
        }
    };

    return (
        <Layout>
            <div className="page-content">
                <div className="container-fluid">
                    <div className="row">
                        <div className="col-sm-12">
                            <div className="page-title-box d-md-flex justify-content-md-between align-items-center">
                                <h4 className="page-title">{t('clients.title')}</h4>
                                <ol className="breadcrumb mb-0">
                                    <li className="breadcrumb-item"><a href="/">Assur&apos;Assistance</a></li>
                                    <li className="breadcrumb-item active">{t('clients.title')}</li>
                                </ol>
                            </div>
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-12">
                            <div className="card">
                                <div className="card-header d-flex justify-content-between align-items-center flex-wrap gap-2">
                                    <h5 className="card-title mb-0">{t('clients.list')}</h5>
                                    <div className="d-flex align-items-center gap-2">
                                        {selectedIds.length > 0 && (
                                            <button type="button" className="btn btn-danger btn-sm" onClick={() => setShowBulkDeleteModal(true)} title={t('clients.deleteSelection')}>
                                                <i className="iconoir-trash" style={{ fontSize: '1.1rem' }} />
                                                <span className="ms-1">{t('clients.deleteSelectionTitle', { count: selectedIds.length })}</span>
                                            </button>
                                        )}
                                        <div className="d-flex align-items-center gap-2">
                                            <button type="button" className="btn btn-success btn-sm" onClick={handleGenerateAll} disabled={generatingAll || filteredClients.length === 0} title={t('clients.generateVisibleZip')}>
                                                <i className={`iconoir-download ${generatingAll ? 'opacity-50' : ''}`} style={{ fontSize: '1.1rem' }} />
                                                {generatingAll ? (
                                                    <span className="ms-1">{generateProgress ? t('clients.generatingLabel', { current: generateProgress.current.toLocaleString('fr-FR'), total: generateProgress.total.toLocaleString('fr-FR') }) : t('clients.generatingShort')}</span>
                                                ) : (
                                                    <span className="ms-1">{t('clients.generateZip')}</span>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div className="card-body">
                                    {!loading && (
                                        <div className="mb-3">
                                            <input
                                                type="search"
                                                className="form-control"
                                                placeholder={t('clients.searchPlaceholder')}
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                aria-label={t('clients.searchPlaceholder')}
                                            />
                                            {searchTerm.trim() && (
                                                <span className="text-muted small mt-1 d-block">{t('clients.resultsOnPage', { count: filteredClients.length })}</span>
                                            )}
                                        </div>
                                    )}
                                    {loading ? (
                                        <div className="text-center py-4"><Loader /></div>
                                    ) : (
                                        <div className="table-responsive">
                                            <table className="table table-hover mb-0">
                                                <thead>
                                                    <tr>
                                                        <th style={{ width: 44 }}>
                                                            <input type="checkbox" className="form-check-input" checked={filteredClients.length > 0 && selectedIds.length === filteredClients.length} onChange={toggleSelectAll} aria-label={t('clients.selectAll')} title={t('clients.selectAll')} />
                                                        </th>
                                                        <th>{t('clients.firstNames')}</th>
                                                        <th>{t('clients.lastName')}</th>
                                                        <th>{t('clients.cardId')}</th>
                                                        <th>{t('clients.contractType')}</th>
                                                        <th width="140">{t('clients.actions')}</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {clients.length === 0 ? (
                                                        <tr><td colSpan="6" className="text-center text-muted">{t('clients.noClient')}</td></tr>
                                                    ) : filteredClients.length === 0 ? (
                                                        <tr><td colSpan="6" className="text-center text-muted">{t('clients.noResult', { term: searchTerm.trim() })}</td></tr>
                                                    ) : (
                                                        filteredClients.map((c) => (
                                                            <tr key={c.id}>
                                                                <td>
                                                                    <input type="checkbox" className="form-check-input" checked={selectedIds.includes(c.id)} onChange={() => toggleSelect(c.id)} aria-label={`Sélectionner ${c.prenomClient} ${c.nomClient}`} />
                                                                </td>
                                                                <td>{c.prenomClient}</td>
                                                                <td>{c.nomClient}</td>
                                                                <td>{c.idCarteBancaire}</td>
                                                                <td>{c.typeContrat}</td>
                                                                <td>
                                                                    <div className="d-flex align-items-center gap-1">
                                                                        <button type="button" className="btn btn-sm btn-outline-primary p-2" onClick={() => openEdit(c)} title={t('clients.edit')} aria-label={t('clients.edit')}>
                                                                            <i className="iconoir-edit" style={{ fontSize: '1rem' }} />
                                                                        </button>
                                                                        <button type="button" className="btn btn-sm btn-outline-success p-2" onClick={() => handleGenerateOne(c)} disabled={generatingId === c.id} title={t('clients.generateContract')} aria-label={t('clients.generateContract')}>
                                                                            {generatingId === c.id ? <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" /> : <i className="iconoir-download" style={{ fontSize: '1rem' }} />}
                                                                        </button>
                                                                        <button type="button" className="btn btn-sm btn-outline-danger p-2" onClick={() => setClientToDelete(c)} title={t('clients.delete')} aria-label={t('clients.delete')}>
                                                                            <i className="iconoir-trash" style={{ fontSize: '1rem' }} />
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                    {!loading && (
                                        <div className="table-footer d-flex flex-wrap align-items-center justify-content-between gap-2 mt-3 pt-3 border-top">
                                            <div className="d-flex align-items-center gap-2">
                                                <label className="form-label mb-0 text-nowrap">{t('clients.perPage')}</label>
                                                <select className="form-select form-select-sm w-auto" value={limit} onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}>
                                                    <option value={10}>10</option>
                                                    <option value={25}>25</option>
                                                    <option value={50}>50</option>
                                                    <option value={100}>100</option>
                                                    <option value={200}>200</option>
                                                    <option value={500}>500</option>
                                                    <option value={1000}>1000</option>
                                                </select>
                                                <span className="text-muted small">{t('clients.totalClients', { count: total })}</span>
                                            </div>
                                            <nav aria-label="Pagination du tableau">
                                                <ul className="pagination pagination-sm mb-0">
                                                    <li className={`page-item ${page <= 1 ? 'disabled' : ''}`}>
                                                        <button type="button" className="page-link" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>{t('clients.previous')}</button>
                                                    </li>
                                                    {totalPages > 1 && Array.from({ length: totalPages }, (_, i) => i + 1)
                                                        .filter((p) => p === 1 || p === totalPages || (p >= page - 2 && p <= page + 2))
                                                        .map((p, i, arr) => (
                                                            <React.Fragment key={p}>
                                                                {i > 0 && arr[i - 1] !== p - 1 && <li className="page-item disabled"><span className="page-link">…</span></li>}
                                                                <li className={`page-item ${p === page ? 'active' : ''}`}>
                                                                    <button type="button" className="page-link" onClick={() => setPage(p)}>{p}</button>
                                                                </li>
                                                            </React.Fragment>
                                                        ))}
                                                    <li className={`page-item ${page >= totalPages ? 'disabled' : ''}`}>
                                                        <button type="button" className="page-link" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>{t('clients.next')}</button>
                                                    </li>
                                                </ul>
                                                <span className="ms-2 text-muted small">{t('clients.page', { page, total: totalPages || 1 })}</span>
                                            </nav>
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
                                <h5 className="modal-title">{t('clients.editClient')}</h5>
                                <button type="button" className="btn-close" onClick={closeModal} aria-label={t('common.cancel')} />
                            </div>
                            <form onSubmit={handleSave}>
                                <div className="modal-body">
                                    <div className="mb-3">
                                        <label className="form-label">{t('clients.firstNames')}</label>
                                        <input type="text" className="form-control" name="prenomClient" value={form.prenomClient} onChange={(e) => setForm((p) => ({ ...p, prenomClient: e.target.value }))} />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">{t('clients.lastName')}</label>
                                        <input type="text" className="form-control" name="nomClient" value={form.nomClient} onChange={(e) => setForm((p) => ({ ...p, nomClient: e.target.value }))} />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">{t('clients.cardNumberLabel')}</label>
                                        <input type="text" className="form-control" name="idCarteBancaire" value={form.idCarteBancaire} onChange={(e) => setForm((p) => ({ ...p, idCarteBancaire: e.target.value }))} />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">{t('clients.contractType')}</label>
                                        <select className="form-select" value={form.typeContrat} onChange={(e) => setForm((p) => ({ ...p, typeContrat: e.target.value }))}>
                                            {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={closeModal}>{t('common.cancel')}</button>
                                    <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? t('clients.saving') : t('common.save')}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {clientToDelete && (
                <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">{t('clients.deleteClientTitle')}</h5>
                                <button type="button" className="btn-close" onClick={() => setClientToDelete(null)} aria-label={t('common.cancel')} />
                            </div>
                            <div className="modal-body">
                                <p className="mb-0">{t('clients.deleteClientConfirm', { name: `${clientToDelete.prenomClient} ${clientToDelete.nomClient}` })}</p>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setClientToDelete(null)}>{t('common.cancel')}</button>
                                <button type="button" className="btn btn-danger" onClick={handleDelete} disabled={deleting}>{deleting ? t('clients.deleting') : t('clients.deleteAction')}</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showBulkDeleteModal && (
                <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">{t('clients.deleteSelection')}</h5>
                                <button type="button" className="btn-close" onClick={() => setShowBulkDeleteModal(false)} aria-label={t('common.cancel')} />
                            </div>
                            <div className="modal-body">
                                <p className="mb-0">{t('clients.deleteSelectionConfirm', { count: selectedIds.length })}</p>
                                {deleteBulkProgress && (
                                    <p className="mb-0 mt-2 text-muted small">{t('clients.deletingProgress', { current: deleteBulkProgress.current.toLocaleString('fr-FR'), total: deleteBulkProgress.total.toLocaleString('fr-FR') })}</p>
                                )}
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowBulkDeleteModal(false)} disabled={deletingBulk}>{t('common.cancel')}</button>
                                <button type="button" className="btn btn-danger" onClick={handleBulkDelete} disabled={deletingBulk}>{deletingBulk ? t('clients.deleting') : t('clients.deleteAction')}</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
};
