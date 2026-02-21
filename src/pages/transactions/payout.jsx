import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { useSelector } from 'react-redux';
import { jwtDecode } from 'jwt-decode';

import { getAllPayoutTransactions } from '../../config/urls/transaction';
import { getMainBalance, getPartnerBalance } from '../../config/urls/partners';
import { sendToastError } from '../../helpers';
import { getCurrentMonthDates } from '../../utils';

import { Layout } from '../../components/layout';
import { TransactionList } from '../../components/transaction/list';
import { Footer } from '../../components/footer';
import { Loader } from '../../components/loader';
import { CommissionCard } from '../../components/transaction/commission-card';
import { AgregatorCard } from '../../components/transaction/agregator-card';

export const Payout = () => {
    
    const token = useSelector(state => state.auth.token);
    const currentMonthDates = getCurrentMonthDates();
    const [payoutTransactions, setPayoutTransactions] = useState(null);
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

    const fetchPayoutTransactions = async ({
        start_date = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        end_date = new Date().toISOString().split('T')[0],
        page = 1,
        limit = 10,
        date = new Date().toISOString().split('T')[0],
        ...otherFilters
    } = {}) => {
        try {
            setLoading(true);
            // Filtrer les valeurs vides pour éviter d'envoyer des paramètres inutiles
            const cleanFilters = Object.fromEntries(
                Object.entries(otherFilters).filter(([_, value]) => value !== '' && value !== null && value !== undefined)
            );

            const queryParams = new URLSearchParams({
                start_date,
                end_date,
                page,
                limit,
                date,
                ...cleanFilters
            });
            const response = await fetch(`${getAllPayoutTransactions}?${queryParams.toString()}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            })
            const result = await response.json()
            if (result.success) {
                setPayoutTransactions(result.data.response)
                setPagination(result.data.pagination || null)
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
        fetchPayoutTransactions({ ...updatedFilters, page: 1 });
    };

    const handlePageChange = (page) => {
        setCurrentPage(page);
        fetchPayoutTransactions({ ...filters, page });
    };

    const handleFiltersChange = (newFilters) => {
        setFilters(newFilters);
        setCurrentPage(1);
        fetchPayoutTransactions({ ...newFilters, page: 1 });
    };

    useEffect(() => {
        fetchPayoutTransactions()
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
                                <h4 className="page-title">Transferts</h4>
                                <div className="">
                                    <ol className="breadcrumb mb-0">
                                        <li className="breadcrumb-item">
                                            <Link to="/">OrionPay</Link>
                                        </li>
                                        <li className="breadcrumb-item active">Liste des transferts</li>
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

                        <TransactionList
                            transactions={payoutTransactions}
                            onPeriodChange={handlePeriodChange}
                            onFiltersChange={handleFiltersChange}
                            hasFilters={true}
                            onPageChange={handlePageChange}
                            hasPagination={true}
                            pagination={pagination}
                            type="payout"
                        />

                    </div>
                </div>
                <Footer />
            </div>
        </Layout>
    )
}