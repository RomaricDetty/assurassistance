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

const INITIAL_FORM = {
    prenom: '',
    nom: '',
    idCarte: '',
    typeContrat: ''
};

/**
 * Page Contrats clients : formulaire pour pré-remplir un PDF par type de contrat,
 * téléchargement du fichier renommé, ou import Excel pour génération en lot.
 */
export const ContratsClients = () => {
    const token = useSelector((s) => s.auth.token);
    const [formData, setFormData] = useState(INITIAL_FORM);
    const [loading, setLoading] = useState(false);
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
                sendToastError(createRes.message || 'Erreur enregistrement client');
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

    /** Pour chaque ligne Excel : enregistre le client via l'API puis génère le PDF. */
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
        setLoading(true);
        try {
            let saved = 0;
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
                if (!createRes.data && !createRes.success) continue;
                saved++;
                const url = getTemplateUrl(data.typeContrat);
                const res = await fetch(url);
                if (!res.ok) continue;
                const buffer = await res.arrayBuffer();
                const filled = await fillPdfContrat(buffer, data);
                const blob = new Blob([filled], { type: 'application/pdf' });
                downloadBlob(blob, getContratFileName(data));
            }
            sendToastSuccess(`${saved} client(s) enregistré(s) et contrat(s) généré(s)`);
        } catch (err) {
            sendToastError(err.message || 'Erreur lors de la génération');
        } finally {
            setLoading(false);
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
                                <div className="card-body">
                                    <p className="text-muted small mb-2">
                                        Colonnes Excel : <strong>Prénoms</strong>, <strong>Nom</strong>, <strong>ID / N° de carte</strong>, <strong>Type de contrat</strong> (Business, Premier ou Platinum).
                                    </p>
                                    <button type="button" className="btn btn-outline-success btn-sm mb-3" onClick={handleDownloadExcelTemplate}>
                                        <i className="iconoir-download me-1" /> Télécharger un fichier Excel modèle
                                    </button>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".xlsx,.xls"
                                        className="form-control"
                                        onChange={handleExcelUpload}
                                        disabled={loading}
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
