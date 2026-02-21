import React, { useState, useEffect } from 'react';
import { getStatistics } from '../../config/urls/partners';
import { getAllPayinTransactions } from '../../config/urls/transaction';
import { useSelector } from 'react-redux';
import { sendToastError } from '../../helpers';
import { Footer } from '../../components/footer';
import { ReportChart } from '../../components/transaction/report-chart';
import { TransactionList } from '../../components/transaction/list';
import { Layout } from '../../components/layout';
import { Loader } from '../../components/loader';

export const Home = () => {

    const token = useSelector(state => state.auth.token)

    const [statistics, setStatistics] = useState(null)
    const [payinTransactions, setPayinTransactions] = useState(null)
    const [loading, setLoading] = useState(true)
    const [pagination, setPagination] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [filters, setFilters] = useState({});

    const fetchStatistics = async ({
        period = null,
        end_date = null,
        start_date = null,
        top_limit = 10
    } = {}) => {
        try {
            const queryParams = new URLSearchParams({
                period,
                end_date,
                start_date,
                top_limit
            });

            const response = await fetch(`${getStatistics}?${queryParams.toString()}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            const result = await response.json()
            if (result.success) {
                setStatistics(result.data)
            } else {
                sendToastError('Erreur lors de la récupération des statistiques')
            }
        } catch (error) {
            console.error('Erreur:', error)
            sendToastError('Erreur lors de la récupération des statistiques')
        }
    }
    const fetchPayinTransactions = async ({
        start_date = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        end_date = new Date().toISOString().split('T')[0],
        page = 1,
        limit = 10,
        ...otherFilters
    } = {}) => {
        try {

            const queryParams = new URLSearchParams({
                start_date,
                end_date,
                page,
                limit,
                ...otherFilters
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
            } else {
                sendToastError('Erreur lors de la récupération des transactions')
            }
        } catch (error) {
            console.error('Erreur:', error)
            sendToastError('Erreur lors de la récupération des transactions')
        } finally {
            setLoading(false)
        }
    }
    const handlePeriodChange = (dateParams) => {
        fetchPayinTransactions(dateParams);
        setCurrentPage(1);
    };

    const handlePageChange = (page) => {
        setCurrentPage(page);
        fetchPayinTransactions({ page, ...filters });
    };

    // const handleFiltersChange = (newFilters) => {
    //     setFilters(newFilters);
    //     setCurrentPage(1);
    //     fetchPayinTransactions({ ...newFilters, page: 1 });
    // };

    useEffect(() => {
        fetchStatistics({})
        fetchPayinTransactions()
    }, [])

  return (
        <Layout>
            <div className="page-content">
                <div className="container-fluid">
                    <div className="row">
                        <div className="col-sm-12">
                            <div className="page-title-box d-md-flex justify-content-md-between align-items-center">
                                <h4 className="page-title">Tableau de bord</h4>
                                <div className="">
                                    <ol className="breadcrumb mb-0">
                                        <li className="breadcrumb-item">
                                            <a href="#">OrionPay</a>
                                        </li>
                                        {/*end nav-item*/}
                                        <li className="breadcrumb-item active">Tableau de bord</li>
                                    </ol>
                                </div>
                            </div>
                            {/*end page-title-box*/}
                        </div>
                        {/*end col*/}
                    </div>
                    {/*end row*/}
                    {statistics && (
                        <div className="row justify-content-center">

                            {/*end col*/}
                            <div className="col-lg-12">
                                <div className="row justify-content-center">
                                    <div className="col-md-6 col-lg-6">
                                        <div className="card bg-corner-img">
                                            <div className="card-body">
                                                <div className="row d-flex justify-content-center">
                                                    <div className="col-12">
                                                        <p className="text-muted text-uppercase mb-0 fw-normal fs-13">
                                                            Revenu Total
                                                        </p>
                                                        <h4 className="mt-1 mb-0 fw-medium">{statistics?.main_statistics.total_revenue} FCFA</h4>
                                                    </div>
                                                    
                                                </div>
                                                {/*end row*/}
                                            </div>
                                            {/*end card-body*/}
                                        </div>
                                        {/*end card*/}
                                    </div>
                                    {/*end col*/}
                                    <div className="col-md-6 col-lg-6">
                                        <div className="card bg-corner-img">
                                            <div className="card-body">
                                                <div className="row d-flex justify-content-center">
                                                    <div className="col-12">
                                                        <p className="text-muted text-uppercase mb-0 fw-normal fs-13">
                                                            Moyenne de Revenu
                                                        </p>
                                                        <h4 className="mt-1 mb-0 fw-medium">{statistics?.main_statistics.average_revenue} FCFA</h4>
                                                    </div>
                                                    
                                                </div>
                                                {/*end row*/}
                                            </div>
                                            {/*end card-body*/}
                                        </div>
                                        {/*end card*/}
                                    </div>
                                    {/*end col*/}
                                    <div className="col-md-6 col-lg-6">
                                        <div className="card bg-corner-img">
                                            <div className="card-body">
                                                <div className="row d-flex justify-content-center">
                                                    <div className="col-12">
                                                        <p className="text-muted text-uppercase mb-0 fw-normal fs-13">
                                                            Marchands
                                                        </p>
                                                        <h4 className="mt-1 mb-0 fw-medium">{statistics?.main_statistics.total_merchants}</h4>
                                                    </div>
                                                </div>
                                                {/*end row*/}
                                            </div>
                                            {/*end card-body*/}
                                        </div>
                                        {/*end card*/}
                                    </div>
                                    {/*end col*/}

                                    {/*end col*/}
                                    <div className="col-md-6 col-lg-6">
                                        <div className="card bg-corner-img">
                                            <div className="card-body">
                                                <div className="row d-flex justify-content-center">
                                                    <div className="col-12">
                                                        <p className="text-muted text-uppercase mb-0 fw-normal fs-13">
                                                            Partenaires
                                                        </p>
                                                        <h4 className="mt-1 mb-0 fw-medium">{statistics?.main_statistics.total_partners}</h4>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {/*end row*/}
                            </div>
                            {/*end col*/}
                            <div className="col-md-12 col-lg-12">
                                {loading ? <div className="d-flex justify-content-center align-items-center p-5">
                                    <Loader />
                                </div> :
                                    <ReportChart
                                        payinTransactions={payinTransactions}
                                        onPeriodChange={handlePeriodChange}
                                    />}
                                {/*end card*/}
                            </div>
                            {/*end col*/}
                        </div>
                    )}
                    {/*end row*/}
                    <div className="row justify-content-center">
                        {/*end col*/}
                        <div className="col-md-12 col-lg-12 order-1 order-lg-2">
                            {loading ? <div className="d-flex justify-content-center align-items-center p-5">
                                <Loader />
                            </div> :
                                <TransactionList
                                    transactions={payinTransactions}
                                    onPeriodChange={handlePeriodChange}
                                    hasFilters={false}
                                    onPageChange={handlePageChange}
                                    hasPagination={false}
                                    // pagination={pagination}
                                    // onFiltersChange={handleFiltersChange}
                                />}
                            {/*end card*/}
                        </div>{" "}
                        {/*end col*/}
                    </div>
                    {/*end row*/}
                </div>
                {/* container */}
                {/*Start Rightbar*/}
                {/*Start Rightbar/offcanvas*/}
                <div
                    className="offcanvas offcanvas-end"
                    tabIndex={-1}
                    id="Appearance"
                    aria-labelledby="AppearanceLabel"
                >
                    <div className="offcanvas-header border-bottom justify-content-between">
                        <h5 className="m-0 font-14" id="AppearanceLabel">
                            Appearance
                        </h5>
                        <button
                            type="button"
                            className="btn-close text-reset p-0 m-0 align-self-center"
                            data-bs-dismiss="offcanvas"
                            aria-label="Close"
                        />
                    </div>
                    <div className="offcanvas-body">
                        <h6>Account Settings</h6>
                        <div className="p-2 text-start mt-3">
                            <div className="form-check form-switch mb-2">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    id="settings-switch1"
                                />
                                <label className="form-check-label" htmlFor="settings-switch1">
                                    Auto updates
                                </label>
                            </div>
                            {/*end form-switch*/}
                            <div className="form-check form-switch mb-2">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    id="settings-switch2"
                                    defaultChecked=""
                                />
                                <label className="form-check-label" htmlFor="settings-switch2">
                                    Location Permission
                                </label>
                            </div>
                            {/*end form-switch*/}
                            <div className="form-check form-switch">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    id="settings-switch3"
                                />
                                <label className="form-check-label" htmlFor="settings-switch3">
                                    Show offline Contacts
                                </label>
                            </div>
                            {/*end form-switch*/}
                        </div>
                        {/*end /div*/}
                        <h6>General Settings</h6>
                        <div className="p-2 text-start mt-3">
                            <div className="form-check form-switch mb-2">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    id="settings-switch4"
                                />
                                <label className="form-check-label" htmlFor="settings-switch4">
                                    Show me Online
                                </label>
                            </div>
                            {/*end form-switch*/}
                            <div className="form-check form-switch mb-2">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    id="settings-switch5"
                                    defaultChecked=""
                                />
                                <label className="form-check-label" htmlFor="settings-switch5">
                                    Status visible to all
                                </label>
                            </div>
                            {/*end form-switch*/}
                            <div className="form-check form-switch">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    id="settings-switch6"
                                />
                                <label className="form-check-label" htmlFor="settings-switch6">
                                    Notifications Popup
                                </label>
                            </div>
                            {/*end form-switch*/}
                        </div>
                        {/*end /div*/}
                    </div>
                    {/*end offcanvas-body*/}
                </div>
                {/*end Rightbar/offcanvas*/}
                {/*end Rightbar*/}
                {/*Start Footer*/}
                <Footer />
                {/*end footer*/}
            </div>
        </Layout>
  )
}
