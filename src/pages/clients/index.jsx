import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Layout } from '../../components/layout';
import { Footer } from '../../components/footer';
import { Loader } from '../../components/loader';
import { listClients, updateClient, deleteClient } from '../../services/clients';
import { getTemplateUrl, fillPdfContrat, getContratFileName, downloadBlob } from '../../utils/pdfContrat';
import { sendToastError, sendToastSuccess } from '../../helpers';
import JSZip from 'jszip';

/** Mappe un client API vers les données attendues par fillPdfContrat. */
const clientToPdfData = (c) => ({
    prenom: c.prenomClient ?? '',
    nom: c.nomClient ?? '',
    idCarte: c.idCarteBancaire ?? '',
    typeContrat: c.typeContrat ?? 'Business'
});

const DEFAULT_LIMIT = 10;

/**
 * Page Clients : liste des clients (paginée), modification, génération de contrat (par ligne ou page).
 */
export const Clients = () => {
    const token = useSelector((s) => s.auth.token);
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState({ nomClient: '', prenomClient: '', idCarteBancaire: '', typeContrat: 'Business' });
    const [saving, setSaving] = useState(false);
    const [generatingId, setGeneratingId] = useState(null);
    const [generatingAll, setGeneratingAll] = useState(false);
    const [clientToDelete, setClientToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [selectedIds, setSelectedIds] = useState([]);
    const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
    const [deletingBulk, setDeletingBulk] = useState(false);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(DEFAULT_LIMIT);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    const TYPES = [{ value: 'Business', label: 'Business' }, { value: 'Premier', label: 'Premier' }, { value: 'Platinum', label: 'Platinum' }];

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
            sendToastError('Erreur chargement des clients');
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

    /** Sélectionne ou désélectionne tous les clients de la page courante. */
    const toggleSelectAll = () => {
        const allSelected = clients.length > 0 && selectedIds.length === clients.length;
        setSelectedIds(allSelected ? [] : clients.map((c) => c.id));
    };

    /** Supprime en masse les clients sélectionnés après confirmation. */
    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;
        setDeletingBulk(true);
        let done = 0;
        try {
            for (const id of selectedIds) {
                const res = await deleteClient(token, id);
                if (res.success !== false && (res.data != null || res.message === undefined)) done++;
            }
            sendToastSuccess(`${done} client(s) supprimé(s)`);
            setSelectedIds([]);
            setShowBulkDeleteModal(false);
            fetchList(page, limit);
        } catch (err) {
            sendToastError('Erreur lors de la suppression');
        } finally {
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
                sendToastSuccess('Client mis à jour');
                closeModal();
                fetchList(page, limit);
            } else {
                sendToastError(res.message || 'Erreur mise à jour');
            }
        } catch (err) {
            sendToastError('Erreur mise à jour');
        } finally {
            setSaving(false);
        }
    };

    /** Génère le PDF pour un client. */
    const handleGenerateOne = async (client) => {
        setGeneratingId(client.id);
        try {
            const url = getTemplateUrl(client.typeContrat || 'Business');
            const res = await fetch(url);
            if (!res.ok) throw new Error('Template introuvable');
            const buffer = await res.arrayBuffer();
            const data = clientToPdfData(client);
            const filled = await fillPdfContrat(buffer, data);
            const blob = new Blob([filled], { type: 'application/pdf' });
            downloadBlob(blob, getContratFileName(data));
            sendToastSuccess('Contrat téléchargé');
        } catch (err) {
            sendToastError(err.message || 'Erreur génération');
        } finally {
            setGeneratingId(null);
        }
    };

    /** Génère les PDF de la page courante et les regroupe dans une archive ZIP (un seul téléchargement). */
    const handleGenerateAll = async () => {
        if (clients.length === 0) {
            sendToastError('Aucun client à traiter');
            return;
        }
        setGeneratingAll(true);
        try {
            const zip = new JSZip();
            const usedNames = new Set();
            let count = 0;
            for (const client of clients) {
                const url = getTemplateUrl(client.typeContrat || 'Business');
                const res = await fetch(url);
                if (!res.ok) continue;
                const buffer = await res.arrayBuffer();
                const data = clientToPdfData(client);
                const filled = await fillPdfContrat(buffer, data);
                let fileName = getContratFileName(data);
                while (usedNames.has(fileName)) {
                    const match = fileName.match(/^(.*)_(\d+)\.pdf$/i);
                    const base = match ? match[1] : fileName.replace(/\.pdf$/i, '');
                    const num = match ? parseInt(match[2], 10) + 1 : 1;
                    fileName = `${base}_${num}.pdf`;
                }
                usedNames.add(fileName);
                zip.file(fileName, filled, { binary: true });
                count++;
            }
            if (count === 0) {
                sendToastError('Aucun contrat généré');
                return;
            }
            const zipBlob = await zip.generateAsync({ type: 'blob' });
            downloadBlob(zipBlob, 'contrats_clients.zip');
            sendToastSuccess(`${count} contrat(s) dans l'archive téléchargée`);
        } catch (err) {
            sendToastError(err.message || 'Erreur génération');
        } finally {
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
                sendToastSuccess('Client supprimé');
                setClientToDelete(null);
                fetchList(page, limit);
            } else {
                sendToastError(res.message || 'Erreur suppression');
            }
        } catch (err) {
            sendToastError('Erreur suppression');
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
                                <h4 className="page-title">Clients</h4>
                                <ol className="breadcrumb mb-0">
                                    <li className="breadcrumb-item"><a href="/">Assur&apos;Assistance</a></li>
                                    <li className="breadcrumb-item active">Clients</li>
                                </ol>
                            </div>
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-12">
                            <div className="card">
                                <div className="card-header d-flex justify-content-between align-items-center flex-wrap gap-2">
                                    <h5 className="card-title mb-0">Liste des clients</h5>
                                    <div className="d-flex align-items-center gap-2">
                                        {selectedIds.length > 0 && (
                                            <button type="button" className="btn btn-danger btn-sm" onClick={() => setShowBulkDeleteModal(true)} title="Supprimer la sélection">
                                                <i className="iconoir-trash" style={{ fontSize: '1.1rem' }} />
                                                <span className="ms-1">Supprimer ({selectedIds.length})</span>
                                            </button>
                                        )}
                                        <button type="button" className="btn btn-success btn-sm" onClick={handleGenerateAll} disabled={generatingAll || clients.length === 0} title="Générer les contrats de la page en une archive ZIP">
                                            <i className={`iconoir-download ${generatingAll ? 'opacity-50' : ''}`} style={{ fontSize: '1.1rem' }} />
                                            {generatingAll ? <span className="ms-1">Génération...</span> : <span className="ms-1">Générer contrats (ZIP)</span>}
                                        </button>
                                    </div>
                                </div>
                                <div className="card-body">
                                    {loading ? (
                                        <div className="text-center py-4"><Loader /></div>
                                    ) : (
                                        <div className="table-responsive">
                                            <table className="table table-hover mb-0">
                                                <thead>
                                                    <tr>
                                                        <th style={{ width: 44 }}>
                                                            <input type="checkbox" className="form-check-input" checked={clients.length > 0 && selectedIds.length === clients.length} onChange={toggleSelectAll} aria-label="Tout sélectionner" title="Tout sélectionner" />
                                                        </th>
                                                        <th>Prénoms</th>
                                                        <th>Nom</th>
                                                        <th>ID Carte</th>
                                                        <th>Type contrat</th>
                                                        <th width="140">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {clients.length === 0 ? (
                                                        <tr><td colSpan="6" className="text-center text-muted">Aucun client</td></tr>
                                                    ) : (
                                                        clients.map((c) => (
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
                                                                        <button type="button" className="btn btn-sm btn-outline-primary p-2" onClick={() => openEdit(c)} title="Modifier" aria-label="Modifier">
                                                                            <i className="iconoir-edit" style={{ fontSize: '1rem' }} />
                                                                        </button>
                                                                        <button type="button" className="btn btn-sm btn-outline-success p-2" onClick={() => handleGenerateOne(c)} disabled={generatingId === c.id} title="Générer contrat" aria-label="Générer contrat">
                                                                            {generatingId === c.id ? <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" /> : <i className="iconoir-download" style={{ fontSize: '1rem' }} />}
                                                                        </button>
                                                                        <button type="button" className="btn btn-sm btn-outline-danger p-2" onClick={() => setClientToDelete(c)} title="Supprimer" aria-label="Supprimer">
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
                                                <label className="form-label mb-0 text-nowrap">Par page</label>
                                                <select className="form-select form-select-sm w-auto" value={limit} onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}>
                                                    <option value={10}>10</option>
                                                    <option value={25}>25</option>
                                                    <option value={50}>50</option>
                                                    <option value={100}>100</option>
                                                </select>
                                                <span className="text-muted small">{total} client(s) au total</span>
                                            </div>
                                            <nav aria-label="Pagination du tableau">
                                                <ul className="pagination pagination-sm mb-0">
                                                    <li className={`page-item ${page <= 1 ? 'disabled' : ''}`}>
                                                        <button type="button" className="page-link" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>Préc.</button>
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
                                                        <button type="button" className="page-link" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>Suiv.</button>
                                                    </li>
                                                </ul>
                                                <span className="ms-2 text-muted small">Page {page} / {totalPages || 1}</span>
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
                                <h5 className="modal-title">Modifier le client</h5>
                                <button type="button" className="btn-close" onClick={closeModal} aria-label="Fermer" />
                            </div>
                            <form onSubmit={handleSave}>
                                <div className="modal-body">
                                    <div className="mb-3">
                                        <label className="form-label">Prénoms</label>
                                        <input type="text" className="form-control" name="prenomClient" value={form.prenomClient} onChange={(e) => setForm((p) => ({ ...p, prenomClient: e.target.value }))} />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Nom</label>
                                        <input type="text" className="form-control" name="nomClient" value={form.nomClient} onChange={(e) => setForm((p) => ({ ...p, nomClient: e.target.value }))} />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">ID / N° de carte</label>
                                        <input type="text" className="form-control" name="idCarteBancaire" value={form.idCarteBancaire} onChange={(e) => setForm((p) => ({ ...p, idCarteBancaire: e.target.value }))} />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Type de contrat</label>
                                        <select className="form-select" value={form.typeContrat} onChange={(e) => setForm((p) => ({ ...p, typeContrat: e.target.value }))}>
                                            {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={closeModal}>Annuler</button>
                                    <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Enregistrement...' : 'Enregistrer'}</button>
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
                                <h5 className="modal-title">Supprimer le client</h5>
                                <button type="button" className="btn-close" onClick={() => setClientToDelete(null)} aria-label="Fermer" />
                            </div>
                            <div className="modal-body">
                                <p className="mb-0">Supprimer <strong>{clientToDelete.prenomClient} {clientToDelete.nomClient}</strong> ? Cette action est irréversible.</p>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setClientToDelete(null)}>Annuler</button>
                                <button type="button" className="btn btn-danger" onClick={handleDelete} disabled={deleting}>{deleting ? 'Suppression...' : 'Supprimer'}</button>
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
                                <h5 className="modal-title">Supprimer la sélection</h5>
                                <button type="button" className="btn-close" onClick={() => setShowBulkDeleteModal(false)} aria-label="Fermer" />
                            </div>
                            <div className="modal-body">
                                <p className="mb-0">Supprimer <strong>{selectedIds.length} client(s)</strong> ? Cette action est irréversible.</p>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowBulkDeleteModal(false)}>Annuler</button>
                                <button type="button" className="btn btn-danger" onClick={handleBulkDelete} disabled={deletingBulk}>{deletingBulk ? 'Suppression...' : 'Supprimer'}</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
};
