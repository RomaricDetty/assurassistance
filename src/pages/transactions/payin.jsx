import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { useSelector } from 'react-redux';
import { jwtDecode } from 'jwt-decode';

import { getAllPayinTransactions } from '../../config/urls/transaction';
import { getMainBalance, getPartnerBalance } from '../../config/urls/partners';
import { getCurrentMonthDates } from '../../utils';

import { Layout } from '../../components/layout';
import { TransactionList } from '../../components/transaction/list';
import { Footer } from '../../components/footer';
import { sendToastError } from '../../helpers';
import { Loader } from '../../components/loader';
import { CommissionCard } from '../../components/transaction/commission-card';
import { AgregatorCard } from '../../components/transaction/agregator-card';


export const Payin = () => {
    const token = useSelector(state => state.auth.token);
    const currentMonthDates = getCurrentMonthDates();

    const [payinTransactions, setPayinTransactions] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadingMainBalance, setLoadingMainBalance] = useState(true);
    const [loadingPartnerBalance, setLoadingPartnerBalance] = useState(true);
    const [pagination, setPagination] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    
    const [filters, setFilters] = useState({
        start_date: currentMonthDates.start_date,
        end_date: currentMonthDates.end_date
    });

    const [mainBalance, setMainBalance] = useState(null);
    const [errorMainBalance, setErrorMainBalance] = useState(null);
    const [partnerBalance, setPartnerBalance] = useState(null);
    const [errorPartnerBalance, setErrorPartnerBalance] = useState(null);
    const [payinStatistics, setPayinStatistics] = useState(null);
    
    const fetchMainBalance = async () => {
        try {
            setLoadingMainBalance(true);
            const response = await fetch(getMainBalance, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            const result = await response.json();
            if (result.success) {
                setMainBalance(result.data);
            } else {
                setErrorMainBalance(result.error);
            }
        } catch (error) {
            sendToastError('Erreur lors de la récupération du solde principal');
            setErrorMainBalance(error.message);
        } finally {
            setLoadingMainBalance(false);
        }
    }

    const fetchPartnerBalance = async () => {
        try {
            setLoadingPartnerBalance(true);
            const decodedToken = jwtDecode(token);
            const response = await fetch(`${getPartnerBalance}/${decodedToken.partnerData?.id}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            const result = await response.json();
            if (result.success) {
                setPartnerBalance(result.data);
            } else {
                setErrorPartnerBalance(result.error);
            }
        } catch (error) {
            sendToastError('Erreur lors de la récupération du solde partenaire');
            setErrorPartnerBalance(error.message);
        } finally {
            setLoadingPartnerBalance(false);
        }
    }

    const fetchPayinTransactions = async ({
        page = 1,
        limit = 10,
        start_date = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        end_date = new Date().toISOString().split('T')[0],
        ...otherFilters
    } = {}) => {
        try {
            setLoading(true);
            const cleanFilters = Object.fromEntries(
                Object.entries(otherFilters).filter(([_, value]) => value !== '' && value !== null && value !== undefined)
            );

            const queryParams = new URLSearchParams({
                page,
                limit,
                start_date,
                end_date,
                ...cleanFilters
            });

            const response = await fetch(`${getAllPayinTransactions}?${queryParams.toString()}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            })
            const result = await response.json()
            if (result.success) {
                setPayinTransactions(result.data.response)
                setPagination(result.data.pagination || null)
                setPayinStatistics(result.data.statistics)
            } else {
                sendToastError('Erreur lors de la récupération des transactions')
            }
        } catch (error) {
            sendToastError('Erreur lors de la récupération des transactions')
        } finally {
            setLoading(false)
        }
    }

    const handlePeriodChange = (dateParams) => {
        setCurrentPage(1);
        const updatedFilters = { ...filters, ...dateParams };
        setFilters(updatedFilters);
        fetchPayinTransactions({ ...updatedFilters, page: 1 });
    };

    const handlePageChange = (page) => {
        setCurrentPage(page);
        fetchPayinTransactions({ ...filters, page });
    };

    const handleFiltersChange = (newFilters) => {
        setFilters(newFilters);
        setCurrentPage(1);
        fetchPayinTransactions({ ...newFilters, page: 1 });
    };

    useEffect(() => {
        fetchPayinTransactions()
        fetchMainBalance()
        fetchPartnerBalance()
    }, [])

    return (
        <Layout>
            <div className="page-content">
                <div className="container-fluid">
                    <div className="row">
                        <div className="col-sm-12">
                            <div className="page-title-box d-md-flex justify-content-md-between align-items-center">
                                <h4 className="page-title">Paiements</h4>
                                <div className="">
                                    <ol className="breadcrumb mb-0">
                                        <li className="breadcrumb-item">
                                            <Link to="/">OrionPay</Link>
                                        </li>
                                        <li className="breadcrumb-item active">Liste des paiements</li>
                                    </ol>
                                </div>
                            </div>
                        </div>
                    </div>
                    {loading && <Loader />}
                    <div className="row mb-3">
                        <AgregatorCard
                            loadingMainBalance={loadingMainBalance}
                            errorMainBalance={errorMainBalance}
                            mainBalance={mainBalance}
                        />

                        <CommissionCard
                            loadingPartnerBalance={loadingPartnerBalance}
                            errorPartnerBalance={errorPartnerBalance}
                            partnerBalance={partnerBalance}
                        />
                        <div className="col-md-12 col-lg-12">
                            <div className="card h-100">
                                <div className="card-body d-flex flex-column h-100">
                                    <div className="row d-flex justify-content-center flex-grow-1">
                                        <div className="col-12 col-lg-12">
                                            <div className="row h-100">
                                                <div className="col-md-4">
                                                    <div className="card h-100">
                                                        <div className="card-body d-flex flex-column justify-content-center h-100">
                                                            <div className="row d-flex justify-content-center">
                                                                <div className="col-9">
                                                                    <p className="text-muted text-uppercase mb-0 fw-normal fs-13">Transactions du jour</p>
                                                                    <h4 className="mt-1 mb-0 fw-medium">{payinStatistics?.amounts?.daily} FCFA</h4>
                                                                    <small className="text-muted">Paiements réussis à ce jour</small>
                                                                </div>
                                                                <div className="col-3 align-self-center">
                                                                    <div className="d-flex justify-content-center align-items-center thumb-md rounded mx-auto">
                                                                        <i className="iconoir-dollar-circle fs-22 align-self-center mb-0 text-muted opacity-50"></i>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="col-md-4">
                                                    <div className="card h-100">
                                                        <div className="card-body d-flex flex-column justify-content-center h-100">
                                                            <div className="row d-flex justify-content-center">
                                                                <div className="col-9">
                                                                    <p className="text-muted text-uppercase mb-0 fw-normal fs-13">Transactions du mois</p>
                                                                    <h4 className="mt-1 mb-0 fw-medium">{payinStatistics?.amounts?.monthly} FCFA</h4>
                                                                    <small className="text-muted">Paiements réussis ce mois</small>
                                                                </div>
                                                                <div className="col-3 align-self-center">
                                                                    <div className="d-flex justify-content-center align-items-center thumb-md rounded mx-auto">
                                                                        <i className="iconoir-calendar fs-22 align-self-center mb-0 text-muted opacity-50"></i>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="col-md-4">
                                                    <div className="card h-100">
                                                        <div className="card-body d-flex flex-column justify-content-center h-100">
                                                            <div className="row d-flex justify-content-center">
                                                                <div className="col-9">
                                                                    <p className="text-muted text-uppercase mb-0 fw-normal fs-13">Total historique</p>
                                                                    <h4 className="mt-1 mb-0 fw-medium">{payinStatistics?.amounts?.total} FCFA</h4>
                                                                    <small className="text-muted">Tous les paiements réussis</small>
                                                                </div>
                                                                <div className="col-3 align-self-center">
                                                                    <div className="d-flex justify-content-center align-items-center thumb-md rounded mx-auto">
                                                                        <i className="iconoir-stats-report fs-22 align-self-center mb-0 text-muted opacity-50"></i>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <TransactionList
                        transactions={payinTransactions}
                        onPeriodChange={handlePeriodChange}
                        onFiltersChange={handleFiltersChange}
                        hasFilters={true}
                        onPageChange={handlePageChange}
                        hasPagination={true}
                        pagination={pagination}
                        loading={loading}
                    />
                </div>
                <Footer />
            </div>
        </Layout>
    )
}