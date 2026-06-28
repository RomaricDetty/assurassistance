import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Layout } from '../../components/layout';
import { Footer } from '../../components/footer';
import { LoaderContainer } from '../../components/loader';
import { PageHeader } from '../../components/page-header';
import { listClients } from '../../services/clients';
import { sendToastError } from '../../helpers';
import { useI18n } from '../../i18n';
import { useTypesContrat } from '../../hooks/useTypesContrat';
import { getClientTypeContratId, getTypeCardStyle } from '../../utils/typeContrat';

/**
 * Récupère tous les clients page par page et retourne les effectifs par type de contrat.
 */
const fetchCountsByType = async (token, types) => {
    const limit = 100;
    let page = 1;
    let totalPages = 1;
    const all = [];
    do {
        const res = await listClients(token, { page, limit });
        const list = Array.isArray(res.data) ? res.data : res.data?.clients ?? res.data?.data ?? [];
        all.push(...list);
        const meta = res.meta || {};
        totalPages = meta.totalPages ?? Math.ceil((meta.total ?? list.length) / (meta.limit ?? limit));
        if (list.length < limit) break;
        page++;
    } while (page <= totalPages);

    const counts = {};
    types.forEach((type) => {
        counts[type.id] = 0;
    });
    all.forEach((client) => {
        const typeId = getClientTypeContratId(client);
        if (typeId && counts[typeId] !== undefined) counts[typeId]++;
    });
    return counts;
};

/**
 * Tableau de bord - page d'accueil : affiche le nombre de clients par type de contrat.
 */
export const Home = () => {
    const { t } = useI18n();
    const token = useSelector((s) => s.auth.token);
    const role = useSelector((s) => s.auth.role);
    const administrateur = useSelector((s) => s.auth.administrateur);
    const { types, loading: loadingTypes } = useTypesContrat({ token, role, administrateur });
    const [countsByType, setCountsByType] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!token || loadingTypes) return;
        if (types.length === 0) {
            setCountsByType({});
            setLoading(false);
            return;
        }
        setLoading(true);
        fetchCountsByType(token, types)
            .then(setCountsByType)
            .catch(() => sendToastError(t('home.statsError')))
            .finally(() => setLoading(false));
    }, [token, t, types, loadingTypes]);

    const total = types.reduce((sum, type) => sum + (countsByType[type.id] ?? 0), 0);

    return (
        <Layout>
            <div className="page-content">
                <div className="container-fluid">
                    <PageHeader title={t('home.title')} />

                    {loading || loadingTypes ? (
                        <LoaderContainer />
                    ) : (
                        <>
                            <div className="row mb-4">
                                <div className="col-12">
                                    <div className="card border-0 shadow-sm overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(228, 89, 15, 0.06) 0%, rgba(228, 89, 15, 0.02) 100%)' }}>
                                        <div className="card-body py-4 px-3 px-sm-4 d-flex align-items-center justify-content-between flex-wrap gap-3">
                                            <div className="d-flex align-items-center gap-2 gap-sm-3">
                                                <div className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: 48, height: 48, backgroundColor: 'rgba(228, 89, 15, 0.15)' }}>
                                                    <i className="iconoir-community" style={{ fontSize: '1.5rem', color: '#e4590f' }} />
                                                </div>
                                                <div className="min-w-0">
                                                    <h5 className="mb-0 fw-semibold text-truncate">{t('home.totalClients')}</h5>
                                                    <p className="text-muted small mb-0 d-none d-sm-block">{t('home.allContractTypes')}</p>
                                                </div>
                                            </div>
                                            <div className="text-end ms-auto">
                                                <span className="home-total-count fw-bold" style={{ color: '#e4590f' }}>{total}</span>
                                                <span className="text-muted ms-1">{t('home.clientsSuffix')}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <h5 className="mb-3 fw-semibold">{t('home.distribution')}</h5>
                            <div className="row g-3 g-md-4">
                                {types.map((type, index) => {
                                    const style = getTypeCardStyle(index);
                                    const count = countsByType[type.id] ?? 0;
                                    const percent = total > 0 ? Math.round((count / total) * 100) : 0;
                                    return (
                                        <div key={type.id} className="col-12 col-sm-6 col-xl-4">
                                            <div
                                                className="card border-0 h-100 overflow-hidden position-relative"
                                                style={{
                                                    boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                                                    transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.transform = 'translateY(-4px)';
                                                    e.currentTarget.style.boxShadow = '0 12px 28px rgba(0,0,0,0.12)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.transform = '';
                                                    e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.06)';
                                                }}
                                            >
                                                <div style={{ backgroundColor: style.bgLight }}>
                                                    <div className="card-body p-3 p-sm-4">
                                                        <div className="d-flex align-items-start justify-content-between mb-2 mb-sm-3">
                                                            <div
                                                                className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                                                                style={{ width: 44, height: 44, backgroundColor: 'rgba(255,255,255,0.9)', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
                                                            >
                                                                <i className={style.icon} style={{ fontSize: '1.35rem', color: style.color }} />
                                                            </div>
                                                            <span className="badge rounded-pill px-2 py-1" style={{ backgroundColor: style.color, color: '#fff', fontSize: '0.7rem' }}>
                                                                {percent} %
                                                            </span>
                                                        </div>
                                                        <h2 className="fw-bold mb-1 fs-2" style={{ color: style.color }}>
                                                            {count}
                                                        </h2>
                                                        <p className="text-muted mb-0 small">{type.libelle || type.code}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>
                <Footer />
            </div>
        </Layout>
    );
};
