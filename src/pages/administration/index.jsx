import React, { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { useSelector } from 'react-redux';
import { Layout } from '../../components/layout';
import { Footer } from '../../components/footer';
import { Loader } from '../../components/loader';
import {
    listAdministrateurs,
    createAdministrateur,
    getAdministrateur,
    updateAdministrateur
} from '../../services/administrateurs';
import { sendToastError, sendToastSuccess } from '../../helpers';
import { useI18n } from '../../i18n';

const INITIAL_FORM = {
    login: '',
    password: '',
    nom: '',
    prenom: '',
    email: '',
    isActive: true
};

const DEFAULT_LIMIT = 10;

/**
 * Page Administration : liste des admins (paginée), ajout et modification.
 */
export const Administration = () => {
    const { t } = useI18n();
    const token = useSelector((s) => s.auth.token);
    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(INITIAL_FORM);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(DEFAULT_LIMIT);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    const fetchList = async (pageNum = page, limitNum = limit) => {
        if (!token) return;
        setLoading(true);
        try {
            const res = await listAdministrateurs(token, { page: pageNum, limit: limitNum });
            const list = Array.isArray(res.data) ? res.data : res.data?.administrateurs ?? res.data?.data ?? [];
            setAdmins(list);
            const meta = res.meta || {};
            setTotal(meta.total ?? list.length);
            setTotalPages(meta.totalPages ?? Math.max(1, Math.ceil((meta.total ?? list.length) / (meta.limit ?? limitNum))));
        } catch (err) {
            sendToastError(t('administration.loadingAdminsError'));
            setAdmins([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchList(page, limit);
    }, [token, page, limit]);


    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
        if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    };

    const validate = (isEdit) => {
        const e = {};
        if (!form.login?.trim()) e.login = t('administration.loginRequired');
        if (!isEdit && !form.password?.trim()) e.password = t('administration.passwordRequired');
        if (!form.nom?.trim()) e.nom = t('administration.lastNameRequired');
        if (!form.prenom?.trim()) e.prenom = t('administration.firstNameRequired');
        if (!form.email?.trim()) e.email = t('administration.emailRequired');
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const openAdd = () => {
        setEditingId(null);
        setForm(INITIAL_FORM);
        setErrors({});
        setShowModal(true);
    };

    const openEdit = async (id) => {
        setEditingId(id);
        setForm(INITIAL_FORM);
        setErrors({});
        setShowModal(true);
        setSaving(true);
        try {
            const res = await getAdministrateur(token, id);
            const a = res.data;
            if (a) {
                setForm({
                    login: a.login ?? '',
                    password: '',
                    nom: a.nom ?? '',
                    prenom: a.prenom ?? '',
                    email: a.email ?? '',
                    isActive: a.isActive ?? true
                });
            }
        } catch (err) {
            sendToastError(t('administration.loadingAdminError'));
        } finally {
            setSaving(false);
        }
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingId(null);
        setForm(INITIAL_FORM);
        setErrors({});
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const isEdit = !!editingId;
        if (!validate(isEdit)) return;
        setSaving(true);
        try {
            if (isEdit) {
                const payload = { nom: form.nom, prenom: form.prenom, email: form.email, isActive: form.isActive };
                if (form.password?.trim()) payload.password = form.password;
                const res = await updateAdministrateur(token, editingId, payload);
                if (res.data != null || res.success) {
                    sendToastSuccess(t('administration.updateSuccess'));
                    closeModal();
                    fetchList(page, limit);
                } else {
                    sendToastError(res.message || t('administration.updateError'));
                }
            } else {
                const res = await createAdministrateur(token, {
                    login: form.login,
                    password: form.password,
                    nom: form.nom,
                    prenom: form.prenom,
                    email: form.email,
                    isActive: form.isActive
                });
                if (res.data != null || res.success) {
                    sendToastSuccess(t('administration.createSuccess'));
                    closeModal();
                    fetchList(page, limit);
                } else {
                    sendToastError(res.message || t('administration.createError'));
                }
            }
        } catch (err) {
            sendToastError(err.message || t('administration.genericError'));
        } finally {
            setSaving(false);
        }
    };


    return (
        <Layout>
            <div className="page-content">
                <div className="container-fluid">
                    <div className="row">
                        <div className="col-sm-12">
                            <div className="page-title-box d-md-flex justify-content-md-between align-items-center">
                                <h4 className="page-title">{t('administration.title')}</h4>
                                <ol className="breadcrumb mb-0">
                                    <li className="breadcrumb-item"><a href="/">Assur&apos;Assistance</a></li>
                                    <li className="breadcrumb-item active">{t('administration.title')}</li>
                                </ol>
                            </div>
                        </div>
                    </div>

                    <div className="row">
                        <div className="col-12">
                            <div className="card">
                                <div className="card-header d-flex justify-content-between align-items-center">
                                    <h5 className="card-title mb-0">{t('administration.listTitle')}</h5>
                                    <button type="button" className="btn btn-primary btn-sm" onClick={openAdd}>
                                        {t('administration.addAdmin')}
                                    </button>
                                </div>
                                <div className="card-body">
                                    {loading ? (
                                        <div className="text-center py-4"><Loader /></div>
                                    ) : (
                                        <div className="table-responsive">
                                            <table className="table table-hover mb-0">
                                                <thead>
                                                    <tr>
                                                        <th>{t('administration.login')}</th>
                                                        <th>{t('administration.lastName')}</th>
                                                        <th>{t('administration.firstName')}</th>
                                                        <th>{t('administration.email')}</th>
                                                        <th>{t('administration.active')}</th>
                                                        <th width="100">{t('administration.actions')}</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {admins.length === 0 ? (
                                                        <tr><td colSpan="6" className="text-center text-muted">{t('administration.noAdmin')}</td></tr>
                                                    ) : (
                                                        admins.map((a) => (
                                                            <tr key={a.id}>
                                                                <td>{a.login}</td>
                                                                <td>{a.nom}</td>
                                                                <td>{a.prenom}</td>
                                                                <td>{a.email}</td>
                                                                <td>{a.isActive ? t('administration.yes') : t('administration.no')}</td>
                                                                <td>
                                                                    <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => openEdit(a.id)}>
                                                                        {t('administration.edit')}
                                                                    </button>
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
                                                <label className="form-label mb-0 text-nowrap">{t('administration.perPage')}</label>
                                                <select className="form-select form-select-sm w-auto" value={limit} onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}>
                                                    <option value={10}>10</option>
                                                    <option value={25}>25</option>
                                                    <option value={50}>50</option>
                                                    <option value={100}>100</option>
                                                </select>
                                                <span className="text-muted small">{t('administration.totalAdmins', { count: total })}</span>
                                            </div>
                                            <nav aria-label="Pagination du tableau">
                                                <ul className="pagination pagination-sm mb-0">
                                                    <li className={`page-item ${page <= 1 ? 'disabled' : ''}`}>
                                                        <button type="button" className="page-link" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>{t('administration.previous')}</button>
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
                                                        <button type="button" className="page-link" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>{t('administration.next')}</button>
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

                    <div className="row mt-3">
                        <div className="col-12">
                            <div className="card border-0 shadow-sm">
                                <div className="card-body d-flex flex-wrap align-items-center justify-content-between gap-3">
                                    <div>
                                        <h5 className="mb-1">{t('administration.groupsSection')}</h5>
                                        <p className="text-muted mb-0 small">{t('administration.agentHelp')}</p>
                                    </div>
                                    <Link to="/administration/groupes-agents" className="btn btn-primary">
                                        {t('administration.openDedicatedPage')}
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <Footer />
            </div>

            {showModal && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">{editingId ? t('administration.adminTypeEdit') : t('administration.adminTypeCreate')}</h5>
                                <button type="button" className="btn-close" onClick={closeModal} aria-label={t('common.cancel')} />
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="modal-body">
                                    {saving ? (
                                        <div className="text-center py-3"><Loader /></div>
                                    ) : (
                                        <>
                                            <div className="mb-3">
                                                <label className="form-label">{t('administration.login')}</label>
                                                <input type="text" className={`form-control ${errors.login ? 'is-invalid' : ''}`} name="login" value={form.login} onChange={handleChange} disabled={!!editingId} />
                                                {errors.login && <div className="invalid-feedback">{errors.login}</div>}
                                            </div>
                                            <div className="mb-3">
                                                <label className="form-label">{t('administration.password')} {editingId && t('administration.passwordHint')}</label>
                                                <input type="password" className={`form-control ${errors.password ? 'is-invalid' : ''}`} name="password" value={form.password} onChange={handleChange} />
                                                {errors.password && <div className="invalid-feedback">{errors.password}</div>}
                                            </div>
                                            <div className="mb-3">
                                                <label className="form-label">{t('administration.lastName')}</label>
                                                <input type="text" className={`form-control ${errors.nom ? 'is-invalid' : ''}`} name="nom" value={form.nom} onChange={handleChange} />
                                                {errors.nom && <div className="invalid-feedback">{errors.nom}</div>}
                                            </div>
                                            <div className="mb-3">
                                                <label className="form-label">{t('administration.firstName')}</label>
                                                <input type="text" className={`form-control ${errors.prenom ? 'is-invalid' : ''}`} name="prenom" value={form.prenom} onChange={handleChange} />
                                                {errors.prenom && <div className="invalid-feedback">{errors.prenom}</div>}
                                            </div>
                                            <div className="mb-3">
                                                <label className="form-label">{t('administration.email')}</label>
                                                <input type="email" className={`form-control ${errors.email ? 'is-invalid' : ''}`} name="email" value={form.email} onChange={handleChange} />
                                                {errors.email && <div className="invalid-feedback">{errors.email}</div>}
                                            </div>
                                            <div className="form-check">
                                                <input type="checkbox" className="form-check-input" name="isActive" id="adminActive" checked={form.isActive} onChange={handleChange} />
                                                <label className="form-check-label" htmlFor="adminActive">{t('administration.activeLabel')}</label>
                                            </div>
                                        </>
                                    )}
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={closeModal}>{t('common.cancel')}</button>
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
            )}
        </Layout>
    );
};
