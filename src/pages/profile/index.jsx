import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Layout } from '../../components/layout';
import { Footer } from '../../components/footer';
import { Loader } from '../../components/loader';
import { getAdministrateurMe, updateAdministrateur } from '../../services/administrateurs';
import { sendToastError, sendToastSuccess } from '../../helpers';

/**
 * Page Profil : affiche les infos de l'administrateur connecté (GET /administrateurs/me).
 */
export const Profile = () => {
    const token = useSelector((s) => s.auth.token);
    const [admin, setAdmin] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState({ nom: '', prenom: '', email: '', login: '' });
    const [saving, setSaving] = useState(false);

    const fetchMe = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const res = await getAdministrateurMe(token);
            if (res.data) {
                setAdmin(res.data);
                setForm({
                    nom: res.data.nom ?? '',
                    prenom: res.data.prenom ?? '',
                    email: res.data.email ?? '',
                    login: res.data.login ?? ''
                });
            } else {
                sendToastError('Erreur chargement du profil');
            }
        } catch (err) {
            sendToastError('Erreur chargement du profil');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMe();
    }, [token]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!admin?.id) return;
        setSaving(true);
        try {
            const res = await updateAdministrateur(token, admin.id, {
                nom: form.nom,
                prenom: form.prenom,
                email: form.email
            });
            if (res.data != null || res.success) {
                sendToastSuccess('Profil mis à jour');
                setEditing(false);
                fetchMe();
            } else {
                sendToastError(res.message || 'Erreur mise à jour');
            }
        } catch (err) {
            sendToastError('Erreur mise à jour');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <Layout>
                <div className="page-content">
                    <div className="d-flex justify-content-center align-items-center py-5">
                        <Loader />
                    </div>
                </div>
            </Layout>
        );
    }

    if (!admin) {
        return (
            <Layout>
                <div className="page-content">
                    <div className="container-fluid">
                        <p className="text-muted">Impossible de charger le profil.</p>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="page-content">
                <div className="container-fluid">
                    <div className="row">
                        <div className="col-sm-12">
                            <div className="page-title-box d-md-flex justify-content-md-between align-items-center">
                                <h4 className="page-title">Mon profil</h4>
                                <ol className="breadcrumb mb-0">
                                    <li className="breadcrumb-item"><a href="/">Assur&apos;Assistance</a></li>
                                    <li className="breadcrumb-item active">Profil</li>
                                </ol>
                            </div>
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-lg-6">
                            <div className="card">
                                <div className="card-header d-flex justify-content-between align-items-center">
                                    <h5 className="card-title mb-0">Informations</h5>
                                    {!editing ? (
                                        <button type="button" className="btn btn-sm btn-primary" onClick={() => setEditing(true)}>Modifier</button>
                                    ) : (
                                        <button type="button" className="btn btn-sm btn-secondary" onClick={() => setEditing(false)}>Annuler</button>
                                    )}
                                </div>
                                <div className="card-body">
                                    <form onSubmit={handleSave}>
                                        <div className="mb-3">
                                            <label className="form-label">Login</label>
                                            <input type="text" className="form-control" value={form.login} readOnly disabled />
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">Nom</label>
                                            <input type="text" className="form-control" name="nom" value={form.nom} onChange={handleChange} disabled={!editing} />
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">Prénom</label>
                                            <input type="text" className="form-control" name="prenom" value={form.prenom} onChange={handleChange} disabled={!editing} />
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">Email</label>
                                            <input type="email" className="form-control" name="email" value={form.email} onChange={handleChange} disabled={!editing} />
                                        </div>
                                        <div className="mb-2">
                                            <span className="text-muted">Statut : </span>
                                            <span className={admin.isActive ? 'text-success' : 'text-secondary'}>{admin.isActive ? 'Actif' : 'Inactif'}</span>
                                        </div>
                                        {editing && (
                                            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Enregistrement...' : 'Enregistrer'}</button>
                                        )}
                                    </form>
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
