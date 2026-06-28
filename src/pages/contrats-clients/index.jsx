import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { Layout } from '../../components/layout';
import { Footer } from '../../components/footer';
import { Loader, LoaderContainer } from '../../components/loader';
import { createClient, createClientsBulk, updateClient } from '../../services/clients';
import { getAdministrateurMe } from '../../services/administrateurs';
import { listGroupePartnerClients } from '../../services/accessControl';
import {
    getTemplateUrl,
    fillPdfContrat,
    getContratFileName,
    downloadBlob,
    buildPdfTemplateCache,
    getTemplateFromCache
} from '../../utils/pdfContrat';
import {
    buildClientPayload,
    getClientTypeContratId,
    getTypeContratLabel,
    resolveTypeFromExcel,
    toPdfData
} from '../../utils/typeContrat';
import { useTypesContrat } from '../../hooks/useTypesContrat';
import { sendToastError, sendToastSuccess } from '../../helpers';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import { useI18n } from '../../i18n';
import { PageHeader } from '../../components/page-header';
import { isSuperAdminRole } from '../../utils/rbac';
import { getAgentGroupeId } from '../../utils/agentClients';
import { extractList, isApiSuccess } from '../../utils/apiResponse';

const INITIAL_FORM = {
    prenom: '',
    nom: '',
    idCarte: '',
    typeContratId: ''
};

/** Indique si la réponse API signale un client déjà existant (doublon). */
const isDuplicateError = (res) => {
    const msg = (res?.message || res?.error || '').toLowerCase();
    return /exist|déjà|duplicate|doublon|already|unique|contraint/i.test(msg);
};

/** Message d'erreur affiché pour un doublon. */
const getDuplicateMessage = (res) => {
    if (res?.message?.trim()) return res.message;
    return null;
};

/** Construit l’objet attendu par fillPdfContrat à partir d’un item (API ou payload). */
const itemToPdfData = (c, types = []) => toPdfData(c, types);

/** Génère un nom de fichier unique dans un set (évite doublons dans le ZIP). */
const nextUniqueFileName = (baseFileName, usedNames) => {
    let fileName = baseFileName;
    while (usedNames.has(fileName)) {
        const match = fileName.match(/^(.*)_(\d+)\.pdf$/i);
        const base = match ? match[1] : fileName.replace(/\.pdf$/i, '');
        const num = match ? parseInt(match[2], 10) + 1 : 1;
        fileName = `${base}_${num}.pdf`;
    }
    usedNames.add(fileName);
    return fileName;
};

/**
 * Page Contrats clients : formulaire pour pré-remplir un PDF par type de contrat,
 * téléchargement du fichier renommé, ou import Excel pour génération en lot.
 */
export const ContratsClients = () => {
    const { t } = useI18n();
    const token = useSelector((s) => s.auth.token);
    const role = useSelector((s) => s.auth.role);
    const administrateur = useSelector((s) => s.auth.administrateur);
    const isAgent = !isSuperAdminRole(role);
    const { types, selectOptions, loading: loadingTypes } = useTypesContrat({ token, role, administrateur });
    const [formData, setFormData] = useState(INITIAL_FORM);
    const [loading, setLoading] = useState(false);
    const [loadingExcel, setLoadingExcel] = useState(false);
    /** Progression affichée pendant l'import Excel : { phase, current, total }. */
    const [excelProgress, setExcelProgress] = useState(null);
    const [errors, setErrors] = useState({});
    const fileInputRef = useRef(null);
    const [agentClients, setAgentClients] = useState([]);
    const [loadingAgentClients, setLoadingAgentClients] = useState(false);
    const [agentClientsPage, setAgentClientsPage] = useState(1);
    const [agentClientsLimit, setAgentClientsLimit] = useState(10);
    const [agentClientsTotal, setAgentClientsTotal] = useState(0);
    const [agentClientsTotalPages, setAgentClientsTotalPages] = useState(1);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingClient, setEditingClient] = useState(null);
    const [editForm, setEditForm] = useState({ nomClient: '', prenomClient: '', typeContratId: '' });
    const [savingEdit, setSavingEdit] = useState(false);
    const [generatingClientId, setGeneratingClientId] = useState(null);

    /** Charge la liste paginée des clients via groupes-partner (espace agent). */
    const loadAgentClients = useCallback(async () => {
        if (!token || !isAgent) return;
        setLoadingAgentClients(true);
        try {
            let admin = administrateur;
            let groupeId = getAgentGroupeId(admin);
            if (!groupeId) {
                const me = await getAdministrateurMe(token);
                admin = me?.data ?? admin;
                groupeId = getAgentGroupeId(admin);
            }
            if (!groupeId) {
                setAgentClients([]);
                setAgentClientsTotal(0);
                setAgentClientsTotalPages(1);
                return;
            }

            const res = await listGroupePartnerClients(token, groupeId, {
                page: agentClientsPage,
                limit: agentClientsLimit
            });
            const list = extractList(res, ['clients']);
            setAgentClients(list);
            const meta = res?.meta || {};
            setAgentClientsTotal(meta.total ?? list.length);
            setAgentClientsTotalPages(
                meta.totalPages ?? Math.max(1, Math.ceil((meta.total ?? list.length) / agentClientsLimit))
            );
        } catch {
            setAgentClients([]);
            setAgentClientsTotal(0);
            setAgentClientsTotalPages(1);
            sendToastError(t('contractsClients.myClientsLoadError'));
        } finally {
            setLoadingAgentClients(false);
        }
    }, [administrateur, agentClientsLimit, agentClientsPage, isAgent, t, token]);

    useEffect(() => {
        loadAgentClients();
    }, [loadAgentClients]);

    useEffect(() => {
        if (!formData.typeContratId && selectOptions.length > 0) {
            setFormData((prev) => ({ ...prev, typeContratId: selectOptions[0].value }));
        }
    }, [formData.typeContratId, selectOptions]);

    /** Ouvre la modale d'édition (sans modification du n° de carte). */
    const openEditClient = (client) => {
        setEditingClient(client);
        setEditForm({
            nomClient: client.nomClient ?? '',
            prenomClient: client.prenomClient ?? '',
            typeContratId: getClientTypeContratId(client) || selectOptions[0]?.value || ''
        });
        setShowEditModal(true);
    };

    /** Ferme la modale d'édition. */
    const closeEditClient = () => {
        setShowEditModal(false);
        setEditingClient(null);
    };

    /** Enregistre les modifications client (prénom, nom, type de contrat). */
    const handleSaveEdit = async (e) => {
        e.preventDefault();
        if (!editingClient?.id || !token) return;
        if (!editForm.prenomClient?.trim() || !editForm.nomClient?.trim()) {
            sendToastError(t('contractsClients.editRequiredFields'));
            return;
        }
        setSavingEdit(true);
        try {
            const payload = {
                nomClient: editForm.nomClient.trim(),
                prenomClient: editForm.prenomClient.trim(),
                typeContratId: editForm.typeContratId
            };
            const res = await updateClient(token, editingClient.id, payload);
            if (isApiSuccess(res)) {
                sendToastSuccess(t('contractsClients.updateSuccess'));
                closeEditClient();
                loadAgentClients();
            } else {
                sendToastError(res.message || t('contractsClients.updateError'));
            }
        } catch {
            sendToastError(t('contractsClients.updateError'));
        } finally {
            setSavingEdit(false);
        }
    };

    /** Régénère et télécharge le contrat PDF d'un client existant. */
    const handleRegenerateContract = async (client) => {
        setGeneratingClientId(client.id);
        try {
            const pdfData = itemToPdfData(client, types);
            const url = getTemplateUrl(client.typeContrat || pdfData, types);
            const res = await fetch(url);
            if (!res.ok) throw new Error(t('contractsClients.templatePdfMissing'));
            const buffer = await res.arrayBuffer();
            const filled = await fillPdfContrat(buffer, pdfData);
            const blob = new Blob([filled], { type: 'application/pdf' });
            downloadBlob(blob, getContratFileName(pdfData));
            sendToastSuccess(t('contractsClients.contractDownloaded'));
        } catch (err) {
            sendToastError(err.message || t('contractsClients.generatePdfError'));
        } finally {
            setGeneratingClientId(null);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    };

    const validate = () => {
        const e = {};
        if (!formData.prenom?.trim()) e.prenom = t('contractsClients.firstNameRequired');
        if (!formData.nom?.trim()) e.nom = t('contractsClients.lastNameRequired');
        if (!formData.typeContratId) e.typeContratId = t('contractsClients.contractTypeRequired');
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const formToPdfData = () => toPdfData({
        prenomClient: formData.prenom,
        nomClient: formData.nom,
        idCarteBancaire: formData.idCarte,
        typeContratId: formData.typeContratId
    }, types);

    /** Génère et télécharge un fichier Excel avec les colonnes attendues et des données d'exemple. */
    const handleDownloadExcelTemplate = () => {
        const headers = ['Prénoms', 'Nom', 'ID / N° de carte', 'Type de contrat'];
        const rows = [
            ['Ange-Emmanuel', 'SANOGO', '12345678901234567890', selectOptions[0]?.code || 'Business'],
            ['Marie Evlyne', 'KOUASSI', '98765432109876543210', selectOptions[1]?.code || 'Platinum'],
            ['Jean-Jacques', 'KONAN', '11122233344455566677', selectOptions[2]?.code || 'Premier']
        ];
        const data = [headers, ...rows];
        const ws = XLSX.utils.aoa_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Contrats');
        XLSX.writeFile(wb, 'modele_contrats.xlsx');
        sendToastSuccess(t('contractsClients.excelDownloaded'));
    };

    /** Enregistre le client via l'API puis génère et télécharge le PDF à partir du formulaire. */
    const handleGeneratePdf = async (e) => {
        e.preventDefault();
        if (!validate() || !token) return;
        setLoading(true);
        try {
            const payload = buildClientPayload({
                nomClient: formData.nom?.trim() || '',
                prenomClient: formData.prenom?.trim() || '',
                idCarteBancaire: formData.idCarte?.trim() || '',
                typeContratId: formData.typeContratId
            }, types);
            const createRes = await createClient(token, payload);
            if (!createRes.data && !createRes.success) {
                const msg = isDuplicateError(createRes)
                    ? (getDuplicateMessage(createRes) || t('contractsClients.duplicateClient'))
                    : (createRes.message || t('contractsClients.saveClientError'));
                sendToastError(msg);
                return;
            }
            const url = getTemplateUrl({ typeContratId: formData.typeContratId }, types);
            const res = await fetch(url);
            if (!res.ok) throw new Error(t('contractsClients.templatePdfMissing'));
            const buffer = await res.arrayBuffer();
            const filled = await fillPdfContrat(buffer, formToPdfData());
            const blob = new Blob([filled], { type: 'application/pdf' });
            const fileName = getContratFileName(formToPdfData());
            downloadBlob(blob, fileName);
            sendToastSuccess(t('contractsClients.clientSavedAndDownloaded'));
            if (isAgent) loadAgentClients();
        } catch (err) {
            sendToastError(err.message || t('contractsClients.generatePdfError'));
        } finally {
            setLoading(false);
        }
    };

    /** Lit un fichier Excel : colonnes Prénoms, Nom, ID / N° de carte, Type de contrat. */
    const parseExcelFile = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (ev) => {
                try {
                    const data = new Uint8Array(ev.target.result);
                    const wb = XLSX.read(data, { type: 'array' });
                    const firstSheet = wb.Sheets[wb.SheetNames[0]];
                    const rows = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
                    if (rows.length < 2) {
                        resolve([]);
                        return;
                    }
                    const headers = rows[0].map((h) => String(h || '').trim().toLowerCase());
                    const prenomIdx = headers.findIndex((h) => /prenom|prénom/.test(h));
                    const nomIdx = headers.findIndex((h) => /nom/.test(h) && !/prenom|prénom/.test(h));
                    const idCarteIdx = headers.findIndex((h) => /id|n°?\s*carte|carte/.test(h));
                    const typeIdx = headers.findIndex((h) => /type|contrat/.test(h));

                    const list = [];
                    for (let i = 1; i < rows.length; i++) {
                        const row = rows[i];
                        if (!row || row.every((c) => c == null || c === '')) continue;
                        const prenom = prenomIdx >= 0 ? String(row[prenomIdx] ?? '').trim() : '';
                        const nom = nomIdx >= 0 ? String(row[nomIdx] ?? '').trim() : '';
                        const idCarte = idCarteIdx >= 0 ? String(row[idCarteIdx] ?? '').trim() : '';
                        const resolvedType = resolveTypeFromExcel(types, typeIdx >= 0 ? row[typeIdx] : '');
                        list.push({
                            prenom,
                            nom,
                            idCarte,
                            typeContratId: resolvedType?.id,
                            typeContrat: resolvedType?.code
                        });
                    }
                    resolve(list);
                } catch (err) {
                    reject(err);
                }
            };
            reader.onerror = () => reject(new Error(t('contractsClients.invalidExcel')));
            reader.readAsArrayBuffer(file);
        });
    };

    /**
     * Envoie les lignes Excel à l'API bulk, puis génère les PDF pour les clients créés
     * et les regroupe dans une archive ZIP (un seul téléchargement).
     */
    const handleExcelUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const list = await parseExcelFile(file).catch((err) => {
            sendToastError(err.message || t('contractsClients.invalidExcel'));
            return null;
        });
        if (!list || list.length === 0) {
            sendToastError(t('contractsClients.invalidRowsExpected'));
            e.target.value = '';
            return;
        }
        if (!token) {
            sendToastError(t('contractsClients.authRequired'));
            e.target.value = '';
            return;
        }
        const payloads = list
            .filter((r) => r.nom || r.prenom)
            .map((r) => buildClientPayload({
                nomClient: r.nom || '',
                prenomClient: r.prenom || '',
                idCarteBancaire: r.idCarte || '',
                typeContratId: r.typeContratId,
                typeContratCode: r.typeContrat
            }, types));
        const totalProcessed = payloads.length;
        if (totalProcessed === 0) {
            sendToastError(t('contractsClients.noValidRowsToSend'));
            e.target.value = '';
            return;
        }
        setLoadingExcel(true);
        try {
            /** — Étape 1 : enregistrement en base (obligatoire avant toute génération PDF). */
            setExcelProgress({ phase: 'upload', current: 0, total: totalProcessed });
            const bulkRes = await createClientsBulk(token, payloads);
            const meta = bulkRes.meta || {};
            const data = bulkRes.data || bulkRes;
            const created = Array.isArray(data.created) ? data.created : Array.isArray(data) ? data : [];
            const totalCreated = meta.totalCreated ?? created.length;
            const duplicateCount = meta.conflictsCount ?? data.duplicateCount ?? data.duplicates ?? 0;
            const apiErrors = data.errors || [];
            const firstOtherErrorMessage = apiErrors[0]?.message || (bulkRes.success === false ? bulkRes.message : null);

            if (bulkRes.success === false && totalCreated === 0 && !firstOtherErrorMessage) {
                sendToastError(bulkRes.message || t('contractsClients.bulkCreateError'));
                e.target.value = '';
                return;
            }

            const toGenerate = created.length > 0
                ? created.map((c) => ({
                    prenomClient: c.prenomClient ?? c.prenom,
                    nomClient: c.nomClient ?? c.nom,
                    idCarteBancaire: c.idCarteBancaire ?? c.idCarte,
                    typeContratId: getClientTypeContratId(c),
                    typeContrat: c.typeContrat
                }))
                : payloads.map((p) => ({
                    prenomClient: p.prenomClient,
                    nomClient: p.nomClient,
                    idCarteBancaire: p.idCarteBancaire,
                    typeContratId: p.typeContratId,
                    typeContrat: p.typeContrat
                }));

            if (meta.dataTruncated && meta.messageDetail) {
                sendToastSuccess(meta.messageDetail);
            }
            if (duplicateCount > 0) {
                sendToastError(t('contractsClients.duplicateConflict', { count: duplicateCount, total: totalProcessed }));
            }
            if (firstOtherErrorMessage && toGenerate.length === 0 && duplicateCount === 0) {
                sendToastError(firstOtherErrorMessage);
            }

            /** — Étape 2 : génération des PDF uniquement après enregistrement en base. */
            if (toGenerate.length > 0) {
                const total = toGenerate.length;
                /**
                 * Taille d’un sous-lot (parallèle) : plus le total est grand, plus le sous-lot est petit
                 * pour que la progression s’affiche régulièrement (évite de rester bloqué à « 0 / 15 001 »).
                 */
                const CHUNK_SIZE =
                    total <= 500 ? 500
                    : total <= 2000 ? 500
                    : total <= 5000 ? 500
                    : total <= 15000 ? 500
                    : 300;
                const MAX_PDF_PER_ZIP = 2500;
                const usedNames = new Set();
                const zipBlobs = [];
                let zip = new JSZip();
                let countInZip = 0;

                setExcelProgress({ phase: 'pdf', current: 0, total });
                const templateCache = await buildPdfTemplateCache(types);

                for (let start = 0; start < total; start += CHUNK_SIZE) {
                    const end = Math.min(start + CHUNK_SIZE, total);
                    const batch = toGenerate.slice(start, end);
                    const results = await Promise.all(
                        batch.map(async (c) => {
                            const pdfData = itemToPdfData(c, types);
                            const templateBuf = getTemplateFromCache(templateCache, pdfData);
                            if (!templateBuf) return null;
                            const bufferCopy = templateBuf.slice(0);
                            try {
                                const filled = await fillPdfContrat(bufferCopy, pdfData);
                                return { pdfData, filled };
                            } catch {
                                return null;
                            }
                        })
                    );

                    for (const item of results) {
                        if (!item) continue;
                        const fileName = nextUniqueFileName(getContratFileName(item.pdfData), usedNames);
                        zip.file(fileName, item.filled, { binary: true });
                        countInZip++;
                        if (countInZip >= MAX_PDF_PER_ZIP) {
                            setExcelProgress({ phase: 'zip', current: end, total });
                            zipBlobs.push(await zip.generateAsync({ type: 'blob' }));
                            zip = new JSZip();
                            countInZip = 0;
                            await new Promise((r) => setTimeout(r, 0));
                        }
                    }
                    setExcelProgress({ phase: 'pdf', current: end, total });
                    await new Promise((r) => setTimeout(r, 0));
                }
                if (countInZip > 0) {
                    setExcelProgress({ phase: 'zip', current: total, total });
                    zipBlobs.push(await zip.generateAsync({ type: 'blob' }));
                }
                setExcelProgress(null);
                for (let z = 0; z < zipBlobs.length; z++) {
                    downloadBlob(zipBlobs[z], zipBlobs.length > 1 ? `contrats_clients_${z + 1}.zip` : 'contrats_clients.zip');
                    if (z < zipBlobs.length - 1) await new Promise((r) => setTimeout(r, 300));
                }
                sendToastSuccess(zipBlobs.length > 1
                    ? t('contractsClients.zipDoneMulti', { count: toGenerate.length, archives: zipBlobs.length })
                    : t('contractsClients.zipDoneSingle', { count: toGenerate.length }));
            } else if (duplicateCount === 0 && !firstOtherErrorMessage) {
                sendToastError(t('contractsClients.noClientSaved'));
            }
            if (firstOtherErrorMessage && toGenerate.length > 0) {
                sendToastError(firstOtherErrorMessage);
            }
        } catch (err) {
            sendToastError(err.message || t('contractsClients.generateError'));
        } finally {
            setExcelProgress(null);
            setLoadingExcel(false);
            e.target.value = '';
            if (isAgent) loadAgentClients();
        }
    };

    return (
        <Layout>
            <div className="page-content">
                <div className="container-fluid">
                    <PageHeader title={t('contractsClients.title')} />

                    <div className="row">
                        <div className="col-lg-6">
                            <div className="card">
                                <div className="card-header">
                                    <h5 className="card-title mb-0">{t('contractsClients.newContract')}</h5>
                                </div>
                                <div className="card-body">
                                    <form onSubmit={handleGeneratePdf}>
                                        <div className="mb-3">
                                            <label className="form-label">{t('contractsClients.firstNames')}</label>
                                            <input
                                                type="text"
                                                className={`form-control ${errors.prenom ? 'is-invalid' : ''}`}
                                                name="prenom"
                                                value={formData.prenom}
                                                onChange={handleChange}
                                                placeholder={t('contractsClients.firstNamesPlaceholder')}
                                            />
                                            {errors.prenom && <div className="invalid-feedback">{errors.prenom}</div>}
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">{t('contractsClients.lastName')}</label>
                                            <input
                                                type="text"
                                                className={`form-control ${errors.nom ? 'is-invalid' : ''}`}
                                                name="nom"
                                                value={formData.nom}
                                                onChange={handleChange}
                                                placeholder={t('contractsClients.lastNamePlaceholder')}
                                            />
                                            {errors.nom && <div className="invalid-feedback">{errors.nom}</div>}
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">{t('contractsClients.cardNumberLabel')}</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                name="idCarte"
                                                value={formData.idCarte}
                                                onChange={handleChange}
                                                placeholder={t('contractsClients.cardNumberPlaceholder')}
                                            />
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">{t('contractsClients.contractType')}</label>
                                            <select
                                                className={`form-select ${errors.typeContratId ? 'is-invalid' : ''}`}
                                                name="typeContratId"
                                                value={formData.typeContratId}
                                                onChange={handleChange}
                                                disabled={loadingTypes || selectOptions.length === 0}
                                            >
                                                <option value="">{t('contractsClients.choose')}</option>
                                                {selectOptions.map((type) => (
                                                    <option key={type.value} value={type.value}>{type.label}</option>
                                                ))}
                                            </select>
                                            {errors.typeContratId && <div className="invalid-feedback">{errors.typeContratId}</div>}
                                        </div>
                                        <button type="submit" className="btn btn-primary me-2" disabled={loading}>
                                            {loading ? <Loader size="sm" /> : t('contractsClients.generateDownload')}
                                        </button>
                                        {/* <button type="button" className="btn btn-outline-secondary btn-sm" onClick={handleListPdfFields} disabled={loadingFields || !formData.typeContrat} title="Voir les noms des champs du PDF (diagnostic)">
                                            {loadingFields ? '...' : 'Voir les champs du PDF'}
                                        </button> */}
                                    </form>
                                </div>
                            </div>
                        </div>

                        <div className="col-lg-6">
                            <div className="card">
                                <div className="card-header">
                                    <h5 className="card-title mb-0">{t('contractsClients.excelImport')}</h5>
                                </div>
                                <div className="card-body position-relative">
                                    {loadingExcel && (
                                        <div className="position-absolute top-0 start-0 end-0 bottom-0 d-flex flex-column align-items-center justify-content-center rounded bg-white bg-opacity-50" style={{ zIndex: 5 }}>
                                            <Loader />
                                            <span className="mt-3 mb-3 text-muted small">
                                                {excelProgress?.phase === 'upload'
                                                    ? t('contractsClients.uploadPhase')
                                                    : excelProgress?.phase === 'pdf'
                                                        ? t('contractsClients.pdfPhase', { current: excelProgress.current.toLocaleString('fr-FR'), total: excelProgress.total.toLocaleString('fr-FR') })
                                                        : excelProgress?.phase === 'zip'
                                                            ? t('contractsClients.zipPhase')
                                                            : t('contractsClients.inProgress')}
                                            </span>
                                        </div>
                                    )}
                                    <p className="text-muted small mb-2">
                                        {t('contractsClients.excelColumnsHelp')}
                                    </p>
                                    <button type="button" className="btn btn-outline-success btn-sm mb-3" onClick={handleDownloadExcelTemplate} disabled={loadingExcel}>
                                        <i className="iconoir-download me-1" /> {t('contractsClients.downloadTemplate')}
                                    </button>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".xlsx,.xls"
                                        className="form-control"
                                        onChange={handleExcelUpload}
                                        disabled={loadingExcel}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {isAgent && (
                        <div className="row mt-3">
                            <div className="col-12">
                                <div className="card">
                                    <div className="card-header">
                                        <h5 className="card-title mb-0">{t('contractsClients.myClientsTitle')}</h5>
                                    </div>
                                    <div className="card-body">
                                        <p className="text-muted small mb-3">{t('contractsClients.myClientsHelp')}</p>
                                        {loadingAgentClients ? (
                                            <LoaderContainer className="loader-container-compact" />
                                        ) : agentClients.length === 0 ? (
                                            <p className="text-muted mb-0">{t('contractsClients.myClientsEmpty')}</p>
                                        ) : (
                                            <>
                                                <div className="table-responsive">
                                                    <table className="table table-hover mb-0">
                                                        <thead>
                                                            <tr>
                                                                <th>{t('contractsClients.firstNames')}</th>
                                                                <th>{t('contractsClients.lastName')}</th>
                                                                <th>{t('contractsClients.cardNumberLabel')}</th>
                                                                <th>{t('contractsClients.contractType')}</th>
                                                                <th width="120">{t('contractsClients.actions')}</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {agentClients.map((c) => (
                                                                <tr key={c.id ?? `${c.idCarteBancaire}-${c.nomClient}-${c.prenomClient}`}>
                                                                    <td>{c.prenomClient}</td>
                                                                    <td>{c.nomClient}</td>
                                                                    <td>{c.idCarteBancaire}</td>
                                                                    <td>{getTypeContratLabel(c)}</td>
                                                                    <td>
                                                                        <div className="d-flex align-items-center gap-1">
                                                                            <button
                                                                                type="button"
                                                                                className="btn btn-sm btn-outline-primary p-2"
                                                                                onClick={() => openEditClient(c)}
                                                                                title={t('contractsClients.editClient')}
                                                                                aria-label={t('contractsClients.editClient')}
                                                                            >
                                                                                <i className="iconoir-edit" style={{ fontSize: '1rem' }} />
                                                                            </button>
                                                                            <button
                                                                                type="button"
                                                                                className="btn btn-sm btn-outline-success p-2"
                                                                                onClick={() => handleRegenerateContract(c)}
                                                                                disabled={generatingClientId === c.id}
                                                                                title={t('contractsClients.regenerateContract')}
                                                                                aria-label={t('contractsClients.regenerateContract')}
                                                                            >
                                                                                {generatingClientId === c.id
                                                                                    ? <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                                                                                    : <i className="iconoir-download" style={{ fontSize: '1rem' }} />}
                                                                            </button>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                                <div className="table-footer d-flex flex-wrap align-items-center justify-content-between gap-2 mt-3 pt-3 border-top">
                                                    <div className="d-flex align-items-center gap-2">
                                                        <label className="form-label mb-0 text-nowrap">{t('clients.perPage')}</label>
                                                        <select
                                                            className="form-select form-select-sm w-auto"
                                                            value={agentClientsLimit}
                                                            onChange={(e) => {
                                                                setAgentClientsLimit(Number(e.target.value));
                                                                setAgentClientsPage(1);
                                                            }}
                                                        >
                                                            <option value={10}>10</option>
                                                            <option value={25}>25</option>
                                                            <option value={50}>50</option>
                                                            <option value={100}>100</option>
                                                        </select>
                                                        <span className="text-muted small">{t('clients.totalClients', { count: agentClientsTotal })}</span>
                                                    </div>
                                                    <nav aria-label={t('contractsClients.myClientsTitle')}>
                                                        <ul className="pagination pagination-sm mb-0">
                                                            <li className={`page-item ${agentClientsPage <= 1 ? 'disabled' : ''}`}>
                                                                <button type="button" className="page-link" onClick={() => setAgentClientsPage((p) => Math.max(1, p - 1))} disabled={agentClientsPage <= 1}>{t('clients.previous')}</button>
                                                            </li>
                                                            {agentClientsTotalPages > 1 && Array.from({ length: agentClientsTotalPages }, (_, i) => i + 1)
                                                                .filter((p) => p === 1 || p === agentClientsTotalPages || (p >= agentClientsPage - 2 && p <= agentClientsPage + 2))
                                                                .map((p, i, arr) => (
                                                                    <React.Fragment key={p}>
                                                                        {i > 0 && arr[i - 1] !== p - 1 && <li className="page-item disabled"><span className="page-link">…</span></li>}
                                                                        <li className={`page-item ${p === agentClientsPage ? 'active' : ''}`}>
                                                                            <button type="button" className="page-link" onClick={() => setAgentClientsPage(p)}>{p}</button>
                                                                        </li>
                                                                    </React.Fragment>
                                                                ))}
                                                            <li className={`page-item ${agentClientsPage >= agentClientsTotalPages ? 'disabled' : ''}`}>
                                                                <button type="button" className="page-link" onClick={() => setAgentClientsPage((p) => Math.min(agentClientsTotalPages, p + 1))} disabled={agentClientsPage >= agentClientsTotalPages}>{t('clients.next')}</button>
                                                            </li>
                                                        </ul>
                                                        <span className="ms-2 text-muted small">{t('clients.page', { page: agentClientsPage, total: agentClientsTotalPages || 1 })}</span>
                                                    </nav>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                <Footer />
            </div>

            {showEditModal && editingClient && (
                <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">{t('contractsClients.editClient')}</h5>
                                <button type="button" className="btn-close" onClick={closeEditClient} aria-label={t('common.cancel')} />
                            </div>
                            <form onSubmit={handleSaveEdit}>
                                <div className="modal-body">
                                    <div className="mb-3">
                                        <label className="form-label">{t('contractsClients.firstNames')}</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={editForm.prenomClient}
                                            onChange={(e) => setEditForm((p) => ({ ...p, prenomClient: e.target.value }))}
                                            required
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">{t('contractsClients.lastName')}</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={editForm.nomClient}
                                            onChange={(e) => setEditForm((p) => ({ ...p, nomClient: e.target.value }))}
                                            required
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">{t('contractsClients.cardNumberLabel')}</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={editingClient.idCarteBancaire ?? ''}
                                            readOnly
                                            disabled
                                        />
                                        <div className="form-text">{t('contractsClients.cardNumberNotEditable')}</div>
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">{t('contractsClients.contractType')}</label>
                                        <select
                                            className="form-select"
                                            value={editForm.typeContratId}
                                            onChange={(e) => setEditForm((p) => ({ ...p, typeContratId: e.target.value }))}
                                        >
                                            {selectOptions.map((type) => (
                                                <option key={type.value} value={type.value}>{type.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={closeEditClient}>{t('common.cancel')}</button>
                                    <button type="submit" className="btn btn-primary" disabled={savingEdit}>
                                        {savingEdit ? t('contractsClients.saving') : t('common.save')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
};
