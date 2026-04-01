import React, { useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import { Layout } from '../../components/layout';
import { Footer } from '../../components/footer';
import { Loader } from '../../components/loader';
import { createClient, createClientsBulk } from '../../services/clients';
import {
    TYPES_CONTRAT,
    getTemplateUrl,
    fillPdfContrat,
    getContratFileName,
    downloadBlob,
    listPdfFormFieldNames
} from '../../utils/pdfContrat';
import { sendToastError, sendToastSuccess } from '../../helpers';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import { useI18n } from '../../i18n';

const INITIAL_FORM = {
    prenom: '',
    nom: '',
    idCarte: '',
    typeContrat: ''
};

/** Indique si la réponse API signale un client déjà existant (doublon). */
const isDuplicateError = (res) => {
    const msg = (res?.message || res?.error || '').toLowerCase();
    return /exist|déjà|duplicate|doublon|already|unique|contraint/i.test(msg);
};

/** Message d'erreur affiché pour un doublon. */
const getDuplicateMessage = (res) => {
    if (res?.message?.trim()) return res.message;
    return 'Ce client existe deja.';
};

/** Normalise le type de contrat (Excel ou API) vers Business, Premier ou Platinum. */
const normalizeTypeContrat = (raw) => {
    const s = String(raw ?? '').trim();
    const lower = s.toLowerCase();
    if (lower === 'premier') return 'Premier';
    if (lower === 'platinum') return 'Platinum';
    return 'Business';
};

/** Construit l’objet attendu par fillPdfContrat à partir d’un item (API ou payload). */
const itemToPdfData = (c) => ({
    prenom: c.prenomClient ?? c.prenom ?? '',
    nom: c.nomClient ?? c.nom ?? '',
    idCarte: c.idCarteBancaire ?? c.idCarte ?? '',
    typeContrat: normalizeTypeContrat(c.typeContrat)
});

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
    const [formData, setFormData] = useState(INITIAL_FORM);
    const [loading, setLoading] = useState(false);
    const [loadingExcel, setLoadingExcel] = useState(false);
    /** Progression affichée pendant l'import Excel : { phase, current, total }. */
    const [excelProgress, setExcelProgress] = useState(null);
    const [errors, setErrors] = useState({});
    const [pdfFieldNames, setPdfFieldNames] = useState(null);
    const [loadingFields, setLoadingFields] = useState(false);
    const fileInputRef = useRef(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    };

    const validate = () => {
        const e = {};
        if (!formData.prenom?.trim()) e.prenom = t('contractsClients.firstNameRequired');
        if (!formData.nom?.trim()) e.nom = t('contractsClients.lastNameRequired');
        if (!formData.typeContrat) e.typeContrat = t('contractsClients.contractTypeRequired');
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const formToPdfData = () => ({
        prenom: formData.prenom || '',
        nom: formData.nom || '',
        idCarte: formData.idCarte || '',
        typeContrat: normalizeTypeContrat(formData.typeContrat)
    });

    /** Liste les noms des champs du PDF sélectionné (diagnostic). */
    const handleListPdfFields = async () => {
        const type = formData.typeContrat;
        if (!type) {
            sendToastError(t('contractsClients.selectContractTypeFirst'));
            return;
        }
        setLoadingFields(true);
        setPdfFieldNames(null);
        try {
            const url = getTemplateUrl(type);
            const res = await fetch(url);
            if (!res.ok) throw new Error(t('contractsClients.templateNotFound'));
            const buffer = await res.arrayBuffer();
            const { names, count } = await listPdfFormFieldNames(buffer);
            setPdfFieldNames({ names, count, type });
        } catch (err) {
            sendToastError(err.message || t('contractsClients.generateError'));
        } finally {
            setLoadingFields(false);
        }
    };

    /** Génère et télécharge un fichier Excel avec les colonnes attendues et des données d'exemple. */
    const handleDownloadExcelTemplate = () => {
        const headers = ['Prénoms', 'Nom', 'ID / N° de carte', 'Type de contrat'];
        const rows = [
            ['Ange-Emmanuel', 'SANOGO', '12345678901234567890', 'Premier'],
            ['Marie Evlyne', 'KOUASSI', '98765432109876543210', 'Business'],
            ['Jean-Jacques', 'KONAN', '11122233344455566677', 'Platinum']
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
            const payload = {
                nomClient: formData.nom?.trim() || '',
                prenomClient: formData.prenom?.trim() || '',
                idCarteBancaire: formData.idCarte?.trim() || '',
                typeContrat: normalizeTypeContrat(formData.typeContrat)
            };
            const createRes = await createClient(token, payload);
            if (!createRes.data && !createRes.success) {
                const msg = isDuplicateError(createRes) ? getDuplicateMessage(createRes) : (createRes.message || t('contractsClients.saveClientError'));
                sendToastError(msg);
                return;
            }
            const url = getTemplateUrl(normalizeTypeContrat(formData.typeContrat));
            const res = await fetch(url);
            if (!res.ok) throw new Error(t('contractsClients.templatePdfMissing'));
            const buffer = await res.arrayBuffer();
            const filled = await fillPdfContrat(buffer, formToPdfData());
            const blob = new Blob([filled], { type: 'application/pdf' });
            const fileName = getContratFileName(formData);
            downloadBlob(blob, fileName);
            sendToastSuccess(t('contractsClients.clientSavedAndDownloaded'));
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
                        const typeContrat = normalizeTypeContrat(typeIdx >= 0 ? row[typeIdx] : '');
                        list.push({ prenom, nom, idCarte, typeContrat });
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
            .map((r) => ({
                nomClient: r.nom || '',
                prenomClient: r.prenom || '',
                idCarteBancaire: r.idCarte || '',
                typeContrat: normalizeTypeContrat(r.typeContrat)
            }));
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

            /** Liste pour les PDF (Business, Premier, Platinum) : réponses API si dispo, sinon payloads déjà normalisés. */
            const toGenerate = created.length > 0
                ? created.map((c) => ({
                    prenomClient: c.prenomClient ?? c.prenom,
                    nomClient: c.nomClient ?? c.nom,
                    idCarteBancaire: c.idCarteBancaire ?? c.idCarte,
                    typeContrat: normalizeTypeContrat(c.typeContrat)
                }))
                : payloads.map((p) => ({
                    prenomClient: p.prenomClient,
                    nomClient: p.nomClient,
                    idCarteBancaire: p.idCarteBancaire,
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

            /** — Étape 2 : génération des PDF uniquement après enregistrement en base (types : Business, Premier, Platinum). */
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

                /** Chargement unique des 3 templates (évite 15 000 requêtes réseau). */
                setExcelProgress({ phase: 'pdf', current: 0, total });
                const templateCache = new Map();
                for (const t of TYPES_CONTRAT) {
                    try {
                        const res = await fetch(getTemplateUrl(t.value));
                        if (res.ok) templateCache.set(t.value, await res.arrayBuffer());
                    } catch (_) { /* ignorer */ }
                }

                for (let start = 0; start < total; start += CHUNK_SIZE) {
                    const end = Math.min(start + CHUNK_SIZE, total);
                    const batch = toGenerate.slice(start, end);
                    const results = await Promise.all(
                        batch.map(async (c) => {
                            const pdfData = itemToPdfData(c);
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
        }
    };

    return (
        <Layout>
            <div className="page-content">
                <div className="container-fluid">
                    <div className="row">
                        <div className="col-sm-12">
                            <div className="page-title-box d-md-flex justify-content-md-between align-items-center">
                                <h4 className="page-title">{t('contractsClients.title')}</h4>
                                <ol className="breadcrumb mb-0">
                                    <li className="breadcrumb-item"><a href="/">Assur&apos;Assistance</a></li>
                                    <li className="breadcrumb-item active">{t('contractsClients.title')}</li>
                                </ol>
                            </div>
                        </div>
                    </div>

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
                                                className={`form-select ${errors.typeContrat ? 'is-invalid' : ''}`}
                                                name="typeContrat"
                                                value={formData.typeContrat}
                                                onChange={handleChange}
                                            >
                                                <option value="">{t('contractsClients.choose')}</option>
                                                {TYPES_CONTRAT.map((t) => (
                                                    <option key={t.value} value={t.value}>{t.label}</option>
                                                ))}
                                            </select>
                                            {errors.typeContrat && <div className="invalid-feedback">{errors.typeContrat}</div>}
                                        </div>
                                        <button type="submit" className="btn btn-primary me-2" disabled={loading}>
                                            {loading ? <Loader /> : t('contractsClients.generateDownload')}
                                        </button>
                                        {/* <button type="button" className="btn btn-outline-secondary btn-sm" onClick={handleListPdfFields} disabled={loadingFields || !formData.typeContrat} title="Voir les noms des champs du PDF (diagnostic)">
                                            {loadingFields ? '...' : 'Voir les champs du PDF'}
                                        </button> */}
                                    </form>
                                    {pdfFieldNames && (
                                        <div className="mt-3 p-3 bg-light rounded small">
                                            <strong>{t('contractsClients.pdfFieldsTitle', { type: pdfFieldNames.type, count: pdfFieldNames.count })}</strong>
                                            {pdfFieldNames.count === 0 ? (
                                                <p className="text-warning mb-0 mt-1">{t('contractsClients.noAcroForm')}</p>
                                            ) : (
                                                <>
                                                    <p className="text-muted mb-1 mt-1">{t('contractsClients.detectedNames')}</p>
                                                    <pre className="mb-0 text-break" style={{ maxHeight: '200px', overflow: 'auto' }}>{pdfFieldNames.names.join('\n')}</pre>
                                                </>
                                            )}
                                        </div>
                                    )}
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
                </div>
                <Footer />
            </div>
        </Layout>
    );
};
