import React, { useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import { Layout } from '../../components/layout';
import { Footer } from '../../components/footer';
import { Loader } from '../../components/loader';
import { createClient } from '../../services/clients';
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
    return 'Ce client existe déjà.';
};

/**
 * Page Contrats clients : formulaire pour pré-remplir un PDF par type de contrat,
 * téléchargement du fichier renommé, ou import Excel pour génération en lot.
 */
export const ContratsClients = () => {
    const token = useSelector((s) => s.auth.token);
    const [formData, setFormData] = useState(INITIAL_FORM);
    const [loading, setLoading] = useState(false);
    const [loadingExcel, setLoadingExcel] = useState(false);
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
        if (!formData.prenom?.trim()) e.prenom = 'Le prénom est requis';
        if (!formData.nom?.trim()) e.nom = 'Le nom est requis';
        if (!formData.typeContrat) e.typeContrat = 'Le type de contrat est requis';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const formToPdfData = () => ({
        prenom: formData.prenom || '',
        nom: formData.nom || '',
        idCarte: formData.idCarte || '',
        typeContrat: formData.typeContrat
    });

    /** Liste les noms des champs du PDF sélectionné (diagnostic). */
    const handleListPdfFields = async () => {
        const type = formData.typeContrat;
        if (!type) {
            sendToastError('Sélectionnez d\'abord un type de contrat');
            return;
        }
        setLoadingFields(true);
        setPdfFieldNames(null);
        try {
            const url = getTemplateUrl(type);
            const res = await fetch(url);
            if (!res.ok) throw new Error('Template introuvable');
            const buffer = await res.arrayBuffer();
            const { names, count } = await listPdfFormFieldNames(buffer);
            setPdfFieldNames({ names, count, type });
        } catch (err) {
            sendToastError(err.message || 'Erreur');
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
        sendToastSuccess('Fichier Excel téléchargé');
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
                typeContrat: formData.typeContrat || 'Business'
            };
            const createRes = await createClient(token, payload);
            if (!createRes.data && !createRes.success) {
                const msg = isDuplicateError(createRes) ? getDuplicateMessage(createRes) : (createRes.message || 'Erreur enregistrement client');
                sendToastError(msg);
                return;
            }
            const url = getTemplateUrl(formData.typeContrat);
            const res = await fetch(url);
            if (!res.ok) throw new Error('Template PDF introuvable');
            const buffer = await res.arrayBuffer();
            const filled = await fillPdfContrat(buffer, formToPdfData());
            const blob = new Blob([filled], { type: 'application/pdf' });
            const fileName = getContratFileName(formData);
            downloadBlob(blob, fileName);
            sendToastSuccess('Client enregistré et contrat téléchargé');
        } catch (err) {
            console.error(err);
            sendToastError(err.message || 'Erreur lors de la génération du PDF');
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
                        const typeContrat = typeIdx >= 0 ? String(row[typeIdx] ?? '').trim() : 'Business';
                        list.push({ prenom, nom, idCarte, typeContrat: typeContrat || 'Business' });
                    }
                    resolve(list);
                } catch (err) {
                    reject(err);
                }
            };
            reader.onerror = () => reject(new Error('Lecture du fichier impossible'));
            reader.readAsArrayBuffer(file);
        });
    };

    /**
     * Pour chaque ligne Excel : enregistre le client via l'API, génère le PDF en mémoire,
     * puis regroupe tous les PDF dans une archive ZIP et déclenche un seul téléchargement
     * (évite le blocage des navigateurs sur les téléchargements multiples).
     */
    const handleExcelUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const list = await parseExcelFile(file).catch((err) => {
            sendToastError(err.message || 'Fichier Excel invalide');
            return null;
        });
        if (!list || list.length === 0) {
            sendToastError('Aucune ligne valide. Colonnes attendues : prénom, nom, ID / N° de carte, type de contrat');
            e.target.value = '';
            return;
        }
        if (!token) {
            sendToastError('Authentification requise');
            e.target.value = '';
            return;
        }
        const totalProcessed = list.filter((r) => r.nom || r.prenom).length;
        setLoadingExcel(true);
        try {
            const zip = new JSZip();
            const usedNames = new Set();
            let saved = 0;
            let duplicateCount = 0;
            let firstOtherErrorMessage = null;
            for (let i = 0; i < list.length; i++) {
                const data = list[i];
                if (!data.nom && !data.prenom) continue;
                const payload = {
                    nomClient: data.nom || '',
                    prenomClient: data.prenom || '',
                    idCarteBancaire: data.idCarte || '',
                    typeContrat: data.typeContrat || 'Business'
                };
                const createRes = await createClient(token, payload);
                if (!createRes.data && !createRes.success) {
                    if (isDuplicateError(createRes)) {
                        duplicateCount++;
                    } else {
                        if (!firstOtherErrorMessage) firstOtherErrorMessage = createRes.message || 'Erreur enregistrement';
                    }
                    continue;
                }
                saved++;
                const url = getTemplateUrl(data.typeContrat);
                const res = await fetch(url);
                if (!res.ok) continue;
                const buffer = await res.arrayBuffer();
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
            }
            if (duplicateCount > 0) {
                sendToastError(`${duplicateCount} des ${totalProcessed} donnée(s) existent déjà.`);
            }
            if (firstOtherErrorMessage) {
                sendToastError(firstOtherErrorMessage);
            }
            if (saved > 0) {
                const zipBlob = await zip.generateAsync({ type: 'blob' });
                downloadBlob(zipBlob, 'contrats_clients.zip');
                sendToastSuccess(`${saved} client(s) enregistré(s), archive téléchargée`);
            } else if (duplicateCount === 0 && !firstOtherErrorMessage) {
                sendToastError('Aucun client enregistré');
            }
        } catch (err) {
            sendToastError(err.message || 'Erreur lors de la génération');
        } finally {
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
                                <h4 className="page-title">Contrats clients</h4>
                                <ol className="breadcrumb mb-0">
                                    <li className="breadcrumb-item"><a href="/">Assur&apos;Assistance</a></li>
                                    <li className="breadcrumb-item active">Contrats clients</li>
                                </ol>
                            </div>
                        </div>
                    </div>

                    <div className="row">
                        <div className="col-lg-6">
                            <div className="card">
                                <div className="card-header">
                                    <h5 className="card-title mb-0">Nouveau contrat (formulaire)</h5>
                                </div>
                                <div className="card-body">
                                    <form onSubmit={handleGeneratePdf}>
                                        <div className="mb-3">
                                            <label className="form-label">Prénoms</label>
                                            <input
                                                type="text"
                                                className={`form-control ${errors.prenom ? 'is-invalid' : ''}`}
                                                name="prenom"
                                                value={formData.prenom}
                                                onChange={handleChange}
                                                placeholder="Prénoms du client"
                                            />
                                            {errors.prenom && <div className="invalid-feedback">{errors.prenom}</div>}
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">Nom</label>
                                            <input
                                                type="text"
                                                className={`form-control ${errors.nom ? 'is-invalid' : ''}`}
                                                name="nom"
                                                value={formData.nom}
                                                onChange={handleChange}
                                                placeholder="Nom du client"
                                            />
                                            {errors.nom && <div className="invalid-feedback">{errors.nom}</div>}
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">ID / N° de carte</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                name="idCarte"
                                                value={formData.idCarte}
                                                onChange={handleChange}
                                                placeholder="N° carte bancaire"
                                            />
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">Type de contrat</label>
                                            <select
                                                className={`form-select ${errors.typeContrat ? 'is-invalid' : ''}`}
                                                name="typeContrat"
                                                value={formData.typeContrat}
                                                onChange={handleChange}
                                            >
                                                <option value="">Choisir...</option>
                                                {TYPES_CONTRAT.map((t) => (
                                                    <option key={t.value} value={t.value}>{t.label}</option>
                                                ))}
                                            </select>
                                            {errors.typeContrat && <div className="invalid-feedback">{errors.typeContrat}</div>}
                                        </div>
                                        <button type="submit" className="btn btn-primary me-2" disabled={loading}>
                                            {loading ? <Loader /> : 'Générer et télécharger le contrat'}
                                        </button>
                                        {/* <button type="button" className="btn btn-outline-secondary btn-sm" onClick={handleListPdfFields} disabled={loadingFields || !formData.typeContrat} title="Voir les noms des champs du PDF (diagnostic)">
                                            {loadingFields ? '...' : 'Voir les champs du PDF'}
                                        </button> */}
                                    </form>
                                    {pdfFieldNames && (
                                        <div className="mt-3 p-3 bg-light rounded small">
                                            <strong>Champs du PDF « {pdfFieldNames.type} » :</strong> {pdfFieldNames.count} champ(s).
                                            {pdfFieldNames.count === 0 ? (
                                                <p className="text-warning mb-0 mt-1">Ce PDF n’a pas de champs formulaire AcroForm. Le pré-remplissage ne fonctionne qu’avec des PDF « formulaire » (champs remplissables). Vérifiez que vos modèles sont bien des formulaires PDF et non de simples tableaux dessinés.</p>
                                            ) : (
                                                <>
                                                    <p className="text-muted mb-1 mt-1">Noms détectés (à faire correspondre dans le code si le remplissage échoue) :</p>
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
                                    <h5 className="card-title mb-0">Import Excel</h5>
                                </div>
                                <div className="card-body position-relative">
                                    {loadingExcel && (
                                        <div className="position-absolute top-0 start-0 end-0 bottom-0 d-flex flex-column align-items-center justify-content-center rounded bg-white bg-opacity-50" style={{ zIndex: 5 }}>
                                            <Loader />
                                            <span className="mt-2 text-muted small">Enregistrement et génération en cours...</span>
                                        </div>
                                    )}
                                    <p className="text-muted small mb-2">
                                        Colonnes Excel : <strong>Prénoms</strong>, <strong>Nom</strong>, <strong>ID / N° de carte</strong>, <strong>Type de contrat</strong> (Business, Premier ou Platinum). Les contrats générés sont regroupés dans une archive ZIP (un seul téléchargement).
                                    </p>
                                    <button type="button" className="btn btn-outline-success btn-sm mb-3" onClick={handleDownloadExcelTemplate} disabled={loadingExcel}>
                                        <i className="iconoir-download me-1" /> Télécharger un fichier Excel modèle
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
