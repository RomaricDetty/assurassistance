import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { Layout } from '../../components/layout';
import { Footer } from '../../components/footer';
import { LoaderContainer } from '../../components/loader';
import { PageHeader } from '../../components/page-header';
import { getAdministrateurMe, updateAdministrateurMe } from '../../services/administrateurs';
import { sendToastError, sendToastSuccess } from '../../helpers';
import { useI18n } from '../../i18n';
import { getApiErrorMessage, isApiSuccess } from '../../utils/apiResponse';

/**
 * Page Profil : affiche et met à jour le profil connecté (GET/PUT /administrateurs/me).
 */
export const Profile = () => {
    const { t } = useI18n();
    const token = useSelector((s) => s.auth.token);
    const [admin, setAdmin] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState({ nom: '', prenom: '', email: '', login: '', password: '' });
    const [saving, setSaving] = useState(false);

    const fetchMe = useCallback(async () => {
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
                    login: res.data.login ?? '',
                    password: ''
                });
            } else {
                sendToastError(t('profile.profileLoadError'));
            }
        } catch {
            sendToastError(t('profile.profileLoadError'));
        } finally {
            setLoading(false);
        }
    }, [t, token]);

    useEffect(() => {
        fetchMe();
    }, [fetchMe]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!token) return;
        setSaving(true);
        try {
            const payload = {
                nom: form.nom,
                prenom: form.prenom,
                email: form.email
            };
            if (form.password?.trim()) payload.password = form.password.trim();

            const res = await updateAdministrateurMe(token, payload);
            if (isApiSuccess(res)) {
                sendToastSuccess(t('profile.profileUpdateSuccess'));
                setEditing(false);
                fetchMe();
            } else {
                sendToastError(res.message || t('profile.profileUpdateError'));
            }
        } catch (err) {
            sendToastError(getApiErrorMessage(err, t('profile.profileUpdateError')));
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <Layout>
                <div className="page-content">
                    <LoaderContainer />
                </div>
            </Layout>
        );
    }

    if (!admin) {
        return (
            <Layout>
                <div className="page-content">
                    <div className="container-fluid">
                        <p className="text-muted">{t('profile.profileUnavailable')}</p>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="page-content">
                <div className="container-fluid">
                    <PageHeader title={t('profile.title')} breadcrumbLabel={t('nav.profile')} />
                    <div className="row">
                        <div className="col-lg-6">
                            <div className="card">
                                <div className="card-header d-flex justify-content-between align-items-center">
                                    <h5 className="card-title mb-0">{t('profile.infos')}</h5>
                                    {!editing ? (
                                        <button type="button" className="btn btn-sm btn-primary" onClick={() => { setForm((prev) => ({ ...prev, password: '' })); setEditing(true); }}>{t('profile.edit')}</button>
                                    ) : (
                                        <button type="button" className="btn btn-sm btn-secondary" onClick={() => { setForm((prev) => ({ ...prev, password: '' })); setEditing(false); }}>{t('common.cancel')}</button>
                                    )}
                                </div>
                                <div className="card-body">
                                    <form onSubmit={handleSave}>
                                        <div className="mb-3">
                                            <label className="form-label">{t('administration.login')}</label>
                                            <input type="text" className="form-control" name="login" value={form.login} readOnly disabled />
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">{t('profile.lastName')}</label>
                                            <input type="text" className="form-control" name="nom" value={form.nom} onChange={handleChange} disabled={!editing} />
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">{t('profile.firstName')}</label>
                                            <input type="text" className="form-control" name="prenom" value={form.prenom} onChange={handleChange} disabled={!editing} />
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">{t('administration.email')}</label>
                                            <input type="email" className="form-control" name="email" value={form.email} onChange={handleChange} disabled={!editing} />
                                        </div>
                                        {editing && (
                                            <div className="mb-3">
                                                <label className="form-label">
                                                    {t('administration.password')} <span className="text-muted fw-normal">{t('administration.passwordHint')}</span>
                                                </label>
                                                <input type="password" className="form-control" name="password" value={form.password} onChange={handleChange} autoComplete="new-password" />
                                            </div>
                                        )}
                                        <div className="mb-2">
                                            <span className="text-muted">{t('profile.status')} : </span>
                                            <span className={admin.isActive ? 'text-success' : 'text-secondary'}>{admin.isActive ? t('profile.active') : t('profile.inactive')}</span>
                                        </div>
                                        {editing && (
                                            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? t('common.loading') : t('common.save')}</button>
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
