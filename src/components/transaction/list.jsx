import React, { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { getAllPartners } from '../../config/urls/partners';
import { useSelector } from 'react-redux';
import { formatDateTime } from '../../utils';
import { Loader } from '../loader';
import './index.css';

export const TransactionList = ({
    transactions,
    type = 'payin',
    onPeriodChange,
    onFiltersChange,
    hasFilters = false,
    hasPagination = false,
    pagination = null,
    onPageChange = null,
    loading = false
}) => {

    const [selectedPeriod, setSelectedPeriod] = useState('Ce mois-ci');
    const token = useSelector(state => state.auth.token);
    const [filters, setFilters] = useState({
        status: '',
        partner_id: '',
        transaction_number: '',
        user_phone_number: '',
        service_code: '',
        date: '',
        start_date: '',
        end_date: '',
        search: '',
        sortBy: '',
        order: ''
    });
    const [partners, setPartners] = useState([]);    

    const handleFilterChange = (filterName, value) => {
        const newFilters = { ...filters, [filterName]: value };
        setFilters(newFilters);

        if (onFiltersChange) {
            onFiltersChange(newFilters);
        }
    };


    const clearFilters = () => {
        const clearedFilters = {
            status: '',
            partner_id: '',
            transaction_number: '',
            user_phone_number: '',
            service_code: '',
            date: '',
            start_date: '',
            end_date: '',
            search: '',
            sortBy: '',
            order: ''
        };
        setFilters(clearedFilters);

        if (onFiltersChange) {
            onFiltersChange(clearedFilters);
        }
    };

    const renderFilters = () => {
        if (!hasFilters) return null;

        return (
            <div className="card mb-3">
                <div className="card-header">
                    <h5 className="card-title mb-0">Filtres des transactions</h5>
                </div>
                <div className="card-body">
                    <div className="row g-3">
                        {/* Status Filter */}
                        <div className="col-md-3">
                            <label className="form-label">Statut</label>
                            <select
                                className="form-select"
                                value={filters.status}
                                onChange={(e) => handleFilterChange('status', e.target.value)}
                            >
                                <option value="">Tous les statuts</option>
                                <option value="1">Créé</option>
                                <option value="2">En attente</option>
                                <option value="3">Réussi</option>
                                <option value="4">Échoué</option>
                            </select>
                        </div>

                        {/* Partner Filter */}
                        <div className="col-md-3">
                            <label className="form-label">Partenaire</label>
                            <select
                                className="form-select"
                                value={filters.partner_id}
                                onChange={(e) => handleFilterChange('partner_id', e.target.value)}
                            >
                                <option value="">Tous les partenaires</option>
                                {partners.map((partner) => (
                                    <option key={partner.id} value={partner.id}>{partner.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Transaction Number Search */}
                        <div className="col-md-3">
                            <label className="form-label">Numéro de transaction</label>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Rechercher par numéro"
                                value={filters.transaction_number}
                                onChange={(e) => handleFilterChange('transaction_number', e.target.value)}
                            />
                        </div>

                        {/* Phone Number Filter */}
                        <div className="col-md-3">
                            <label className="form-label">Téléphone</label>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Filtrer par téléphone"
                                value={filters.user_phone_number}
                                onChange={(e) => handleFilterChange('user_phone_number', e.target.value)}
                            />
                        </div>

                        {/* Service Code Filter */}
                        <div className="col-md-3">
                            <label className="form-label">Code de service</label>
                            {getServiceCodeFilter()}
                        </div>

                        {/* Specific Date Filter */}
                        <div className="col-md-3">
                            <label className="form-label">Date spécifique</label>
                            <input
                                type="date"
                                className="form-control"
                                value={filters.date}
                                onChange={(e) => handleFilterChange('date', e.target.value)}
                            />
                        </div>

                        {/* Start Date Filter */}
                        <div className="col-md-3">
                            <label className="form-label">Date de début</label>
                            <input
                                type="date"
                                className="form-control"
                                value={filters.start_date}
                                onChange={(e) => handleFilterChange('start_date', e.target.value)}
                            />
                        </div>

                        {/* End Date Filter */}
                        <div className="col-md-3">
                            <label className="form-label">Date de fin</label>
                            <input
                                type="date"
                                className="form-control"
                                value={filters.end_date}
                                onChange={(e) => handleFilterChange('end_date', e.target.value)}
                            />
                        </div>

                        {/* Global Search */}
                        {/* <div className="col-md-4">
                            <label className="form-label">Recherche globale</label>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Recherche globale"
                                value={filters.search}
                                onChange={(e) => handleFilterChange('search', e.target.value)}
                            />
                        </div> */}

                        {/* Sort By */}
                        <div className="col-md-4">
                            <label className="form-label">Trier par</label>
                            <select
                                className="form-select"
                                value={filters.sortBy}
                                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                            >
                                <option value="">Sélectionner un champ</option>
                                <option value="created_at">Date</option>
                                <option value="amount">Montant</option>
                                <option value="transaction_number">Numéro</option>
                                <option value="status_id">Statut</option>
                            </select>
                        </div>

                        {/* Order */}
                        <div className="col-md-4">
                            <label className="form-label">Ordre</label>
                            <select
                                className="form-select"
                                value={filters.order}
                                onChange={(e) => handleFilterChange('order', e.target.value)}
                            >
                                <option value="">Sélectionner l'ordre</option>
                                <option value="ASC">Plus ancien</option>
                                <option value="DESC">Plus récent</option>
                            </select>
                        </div>

                        {/* Filter Actions */}
                        <div className="col-12">
                            <div className="d-flex gap-2">
                                <button
                                    className="btn btn-outline-secondary"
                                    onClick={clearFilters}
                                >
                                    <i className="las la-times me-1"></i>
                                    Effacer les filtres
                                </button>
                                <button
                                    className="btn btn-primary"
                                    onClick={() => onFiltersChange && onFiltersChange(filters)}
                                >
                                    <i className="las la-search me-1"></i>
                                    Appliquer les filtres
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const getStatusBadge = (status) => {
        const statusMap = {
            'SUCCESS': { class: 'bg-success-subtle text-success', text: 'Réussi' },
            'PENDING': { class: 'bg-warning-subtle text-warning', text: 'En attente' },
            'FAILED': { class: 'bg-danger-subtle text-danger', text: 'Échoué' },
            'CREATED': { class: 'bg-info-subtle text-info', text: 'Créé' }
        };

        const statusInfo = statusMap[status] || { class: 'bg-secondary-subtle text-secondary', text: status };

        return (
            <span className={`badge ${statusInfo.class} fs-11 fw-medium px-2`}>
                {statusInfo.text}
            </span>
        );
    };

    const formatAmount = (amount) => {
        return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
    };

    const getServiceName = (serviceCode) => {
        if (serviceCode === 'PAIEMENTMARCHANDOMPAYCIDIRECT') {
            return (
                <span
                    className="badge service-badge"
                    style={{ backgroundColor: '#ff9800', color: '#fff' }}
                >
                    om
                </span>
            );
        }
        if (serviceCode === 'CI_PAIEMENTWAVE_TP') {
            return (
                <span
                    className="badge service-badge"
                    style={{ backgroundColor: '#4fc3f7', color: '#fff' }}
                >
                    wave
                </span>
            );
        }
        if (serviceCode === 'PAIEMENTMARCHAND_MTN_CI') {
            return (
                <span
                    className="badge service-badge"
                    style={{ backgroundColor: '#ffe066', color: '#495057' }}
                >
                    mtn
                </span>
            );
        }
        if (serviceCode === 'PAIEMENTMARCHAND_MOOV_CI') {
            return (
                <span
                    className="badge service-badge"
                    style={{ backgroundColor: '#43a047', color: '#fff' }}
                >
                    moov
                </span>
            );
        }
        return (
            <span
                className="badge service-badge bg-primary-subtle"
                style={{ backgroundColor: '#007bff', color: '#fff' }}
            >
                {serviceCode}
            </span>
        );
    }

    const getPayoutServiceName = (serviceCode) => {
        switch (serviceCode) {
            case 'CASHINOMCIPART':
                return <span
                    className="badge service-badge"
                    style={{ backgroundColor: '#ff9800', color: '#fff' }}
                >
                    om
                </span>
            case 'CI_CASHIN_WAVE_PART':
                return (
                    <span
                        className="badge service-badge"
                        style={{ backgroundColor: '#4fc3f7', color: '#fff' }}
                    >
                        wave
                    </span>
                );
            case 'CASHINMTNPART':
                return (
                    <span
                        className="badge service-badge"
                        style={{ backgroundColor: '#ffe066', color: '#495057' }}
                    >
                        mtn
                    </span>
                );
            case 'CASHINMOOVPART':
                return (
                    <span
                        className="badge service-badge"
                        style={{ backgroundColor: '#43a047', color: '#fff' }}
                    >
                        moov
                    </span>
                );
            default:
                return serviceCode;
        }
    }

    const handlePeriodChange = (period) => {
        setSelectedPeriod(period);
        const now = new Date();
        let startDate, endDate;

        switch (period) {
            case 'Aujourd\'hui':
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                endDate = now;
                break;
            case 'Cette semaine':
                const dayOfWeek = now.getDay();
                const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
                startDate = new Date(now.setDate(diff));
                endDate = new Date();
                break;
            case 'Ce mois-ci':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                endDate = now;
                break;
            case 'La semaine dernière':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                endDate = now;
                break;
            case 'Le mois dernier':
                startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                endDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case 'Cette année':
                startDate = new Date(now.getFullYear(), 0, 1);
                endDate = now;
                break;
            default:
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                endDate = now;
        }

        const dateParams = {
            start_date: startDate.toISOString().split('T')[0],
            end_date: endDate.toISOString().split('T')[0]
        };

        const updatedFilters = { ...filters, ...dateParams };
        setFilters(updatedFilters);

        if (onPeriodChange) {
            onPeriodChange(dateParams);
        }
    };

    const handlePageChange = (page) => {
        if (onPageChange) {
            onPageChange(page);
        }
    };

    const renderPagination = () => {
        if (!pagination || !hasPagination) return null;
        const {
            currentPage,
            totalPages,
            hasNextPage,
            hasPreviousPage,
            nextPage,
            previousPage,
            totalItems
        } = pagination;
        return (
            <div className="d-flex justify-content-between align-items-center mt-3">
                <div className="text-muted">
                    Page {currentPage} sur {totalPages}
                    ({totalItems} transactions au total)
                </div>
                <ul class="pagination">
                    <li className={`page-item ${!hasPreviousPage ? 'disabled' : ''} cursor-pointer`}>
                        <span className="page-link fw-medium" onClick={() => handlePageChange(previousPage)} disabled={!hasPreviousPage}>précédent</span>
                    </li>

                    <li className="page-item active"><span className="page-link fw-medium" >{currentPage}</span></li>

                    <li className={`page-item ${!hasNextPage ? 'disabled' : ''} cursor-pointer`}>
                        <span className="page-link fw-medium" onClick={() => handlePageChange(nextPage)} disabled={!hasNextPage}>
                            suivant
                        </span>
                    </li>
                </ul>
            </div>
        );
    };

    const fetchPartners = async (page = 1) => {
        try {
            const queryParams = new URLSearchParams({
                page: page.toString(),
                limit: '100'
            })

            const response = await fetch(`${getAllPartners}?${queryParams.toString()}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            })
            const result = await response.json()
            if (result.success) {
                setPartners(result.data.partners)
            }
        } catch (error) {
            sendToastError('Erreur lors de la récupération des partenaires');
        }
    }

    const getServiceCodeFilter = () => {
        switch (type) {
            case 'payin':
                return (
                    <select
                        className="form-select"
                        value={filters.service_code}
                        onChange={(e) => handleFilterChange('service_code', e.target.value)}
                    >
                        <option value="">Tous les services</option>
                        <option value="CI_PAIEMENTWAVE_TP">Wave</option>
                        <option value="PAIEMENTMARCHAND_MOOV_CI">Moov</option>
                        <option value="PAIEMENTMARCHAND_MTN_CI">MTN</option>
                        <option value="PAIEMENTMARCHANDOMPAYCIDIRECT">Orange Money</option>
                    </select>
                )
            case 'payout':
                return (
                    <select
                        className="form-select"
                        value={filters.service_code}
                        onChange={(e) => handleFilterChange('service_code', e.target.value)}
                    >
                        <option value="">Tous les services</option>
                        <option value="CASHINOMCIPART">OM</option>
                        <option value="CI_CASHIN_WAVE_PART">Wave</option>
                        <option value="CASHINMTNPART">MTN</option>
                        <option value="CASHINMOOVPART">Moov</option>
                    </select>
                )
            default:
                return null;
        }



    }

    useEffect(() => {
        if (hasFilters) {
            handlePeriodChange(selectedPeriod);
        }
        fetchPartners();
    }, [selectedPeriod]);

    return (
        <>
            {/* Filters */}
            {hasFilters && renderFilters()}
            <div className="card">
                <div className="card-header">
                    <div className="row align-items-center">
                        <div className="col">
                            <h4 className="card-title">Historique des transactions ({type === 'payin' ? 'paiements' : 'transferts'})</h4>
                        </div>
                        {hasFilters && (
                            <div className="col-auto">
                                <div className="dropdown">
                                    <a
                                        href="#"
                                        className="btn btn-light dropdown-toggle"
                                        data-bs-toggle="dropdown"
                                        aria-haspopup="true"
                                        aria-expanded="false"
                                    >
                                        <i className="icofont-calendar fs-5 me-1" /> {selectedPeriod}
                                        <i className="las la-angle-down ms-1" />
                                    </a>
                                    <div className="dropdown-menu dropdown-menu-end">
                                        <a
                                            className="dropdown-item"
                                            href="#"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                handlePeriodChange("Aujourd'hui");
                                            }}
                                        >
                                            Aujourd'hui
                                        </a>
                                        <a
                                            className="dropdown-item"
                                            href="#"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                handlePeriodChange('7 derniers jours');
                                            }}
                                        >
                                            7 derniers jours
                                        </a>
                                        <a
                                            className="dropdown-item"
                                            href="#"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                handlePeriodChange('30 derniers jours');
                                            }}
                                        >
                                            30 derniers jours
                                        </a>
                                        <a
                                            className="dropdown-item"
                                            href="#"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                handlePeriodChange('Cette année');
                                            }}
                                        >
                                            Cette année
                                        </a>
                                        <a
                                            className="dropdown-item"
                                            href="#"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                handlePeriodChange('Ce mois-ci');
                                            }}
                                        >
                                            Ce mois-ci
                                        </a>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                <div className="card-body pt-0">
                    {loading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}><Loader /></div>
                    ) : (
                        <>
                            <div className="table-responsive">
                                <table className="table mb-0">
                                    <thead className="table-light">
                                        <tr>
                                            <th className="border-top-0">Numéro de transaction</th>
                                            <th className="border-top-0">Marchand</th>
                                            <th className="border-top-0">Service</th>
                                            <th className="border-top-0">Téléphone</th>
                                            <th className="border-top-0">Date</th>
                                            <th className="border-top-0">Montant</th>
                                            <th className="border-top-0">Frais Associé</th>
                                            <th className="border-top-0">Status</th>
                                            <th className="border-top-0">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {transactions && transactions.length > 0 ? (
                                            transactions.map((transaction) => (
                                                <tr key={transaction.id} className="table-row-hover">
                                                    <td>
                                                        <div className="d-flex align-items-center">
                                                            <div className="flex-grow-1 text-truncate">
                                                                {transaction.transaction_number}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="text-truncate">
                                                            {transaction.partner?.name || 'N/A'}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        {type === 'payin' ? getServiceName(transaction.service_code) : getPayoutServiceName(transaction.service_code)}
                                                    </td>
                                                    <td>
                                                        {transaction.user_phone_number}
                                                    </td>
                                                    <td>
                                                        {formatDateTime(transaction.created_at)}
                                                    </td>
                                                    <td>
                                                        <span className="fw-medium">
                                                            {formatAmount(transaction.amount)}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        {transaction.partner?.fees[0]?.value} {transaction.partner?.fees[0] ? transaction.partner?.fees[0]?.type === 'percentage' ? '%' : 'FCFA' : 'N/A'}
                                                    </td>
                                                    <td>
                                                        {getStatusBadge(transaction.status?.code)}
                                                    </td>
                                                    <td>
                                                        <Link to={`/transactions/${transaction.transaction_number}`} title="Voir détails">
                                                            <i className="las la-eye text-secondary fs-18" />
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="9" className="text-center py-4">
                                                    <div className="text-muted">
                                                        Aucune transaction trouvée
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            {/* Pagination */}
                            {hasPagination && renderPagination()}
                        </>
                    )}
                </div>
            </div>
        </>
    );
};