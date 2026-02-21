import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router';
import { getTransactionDetails } from '../../config/urls/transaction';
import { useSelector } from 'react-redux';
import { Layout } from '../../components/layout';
import { Loader } from '../../components/loader';
import { sendToastError } from '../../helpers';
import { formatDateTime, formatAmount } from '../../utils';
import './index.css';

export const TransactionDetails = () => {
    const { tnx } = useParams();
    const navigate = useNavigate();
    const token = useSelector(state => state.auth.token);

    const [transaction, setTransaction] = useState(null);
    const [commission, setCommission] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchTransactionDetails = async () => {
        try {
            const response = await fetch(`${getTransactionDetails}`, {
                method: 'POST',
                body: JSON.stringify({ transactionNumber: tnx }),
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            const result = await response.json();

            if (result.success) {
                setTransaction(result.data.transaction);
                setCommission(result.data.commissions);
            } else {
                sendToastError('Erreur lors de la récupération des détails de la transaction');
            }
        } catch (error) {
            sendToastError('Erreur lors de la récupération des détails de la transaction');
        } finally {
            setLoading(false);
        }
    };

    // Fonction pour obtenir le badge de statut
    const getStatusBadge = (status) => {
        const statusMap = {
            'SUCCESS': { class: 'status-paid', text: 'Succès' },
            'PENDING': { class: 'status-pending', text: 'En attente' },
            'FAILED': { class: 'status-failed', text: 'Échec' },
            'CREATED': { class: 'status-created', text: 'Créé' }
        };

        const statusInfo = statusMap[status] || { class: 'status-unknown', text: status };

        return (
            <span className={`status-badge ${statusInfo.class}`}>
                {statusInfo.text}
            </span>
        );
    };

    // Fonction pour obtenir le nom du service
    const getServiceName = (serviceCode) => {
        if (serviceCode === 'PAIEMENTMARCHANDOMPAYCIDIRECT') {
            return (
                <span
                    className="badge"
                    style={{ backgroundColor: '#ff9800', color: '#fff' }}
                >
                    om
                </span>
            );
        }
        if (serviceCode === 'CI_PAIEMENTWAVE_TP') {
            return (
                <span
                    className="badge"
                    style={{ backgroundColor: '#4fc3f7', color: '#fff' }}
                >
                    wave
                </span>
            );
        }
        if (serviceCode === 'PAIEMENTMARCHAND_MTN_CI') {
            return (
                <span
                    className="badge"
                    style={{ backgroundColor: '#ffe066', color: '#495057' }}
                >
                    mtn
                </span>
            );
        }
        if (serviceCode === 'PAIEMENTMARCHAND_MOOV_CI') {
            return (
                <span
                    className="badge"
                    style={{ backgroundColor: '#43a047', color: '#fff' }}
                >
                    moov
                </span>
            );
        }
        return (
            <span
                className="badge bg-primary-subtle"
                style={{ backgroundColor: '#007bff', color: '#fff' }}
            >
                {serviceCode}
            </span>
        );
    }
    // Fonction pour calculer le montant net
    const calculateNetAmount = (amount, fees, fee_type) => {
        if (fee_type === 'percentage') {
            return amount - (amount * fees / 100);
        } else {
            return amount - fees;
        }
    };

    const getPartnerRoleName = (roleName) => {
        if (roleName === 'partner') {
            return 'Partenaire';
        } else if (roleName === 'merchant') {
            return 'Marchand';
        }
        return roleName;
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

    useEffect(() => {
        if (tnx) {
            fetchTransactionDetails();
        }
    }, [tnx]);

    if (loading) {
        return <Layout>
            <div className='page-content'>
                <div className='container-fluid'>
                    <div className='row'>
                        <div className='col-12'>
                            <div className='d-flex justify-content-center align-items-center h-100'>
                                <Loader />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    }

    if (!transaction) {
        return (
            <Layout>
                <div className="page-content">
                    <div className="container-fluid">
                        <div className="row">
                            <div className="col-12">
                                <div className="text-center py-5">
                                    <h4>Transaction non trouvée</h4>
                                    <button
                                        className="btn btn-primary mt-3"
                                        onClick={() => navigate('/')}
                                    >
                                        Retour au tableau de bord
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="page-content">
                <div className="container-fluid">
                    {/* Header */}
                    <div className="row">
                        <div className="col-12">
                            <div className="page-title-box d-md-flex justify-content-md-between align-items-center">
                                <div className="d-flex align-items-center">
                                    <button
                                        className="btn btn-link me-3"
                                        onClick={() => navigate('/')}
                                    >
                                        <i className="las la-arrow-left fs-4"></i>
                                    </button>
                                    <div>
                                        <h4 className="page-title mb-1">Détails de la transaction</h4>
                                        <small className="text-muted">Transaction #{transaction.transaction_number}</small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Main Content */}
                    <div className="row">
                        <div className="col-12">
                            <div className="transaction-details-container">
                                {/* Transaction Header */}
                                <div className="transaction-header">
                                    <div className="transaction-amount">
                                        <h1 className="amount-display">
                                            {formatAmount(transaction.amount)}
                                        </h1>
                                        {getStatusBadge(transaction.status?.code)}
                                    </div>

                                    <div className="transaction-summary">
                                        <div className="summary-item">
                                            <span className="summary-label">Effectué le</span>
                                            <span className="summary-value">
                                                {formatDateTime(transaction.created_at)}
                                            </span>
                                        </div>
                                        <div className="summary-item">
                                            <span className="summary-label">Effectué par le {getPartnerRoleName(transaction?.partner?.role?.name)}</span>
                                            <span className="summary-value">
                                                {transaction?.partner?.name}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Details Cards */}
                                <div className="row mt-4">
                                    {/* Transaction Details Card */}
                                    <div className={`${transaction.status_id === 3 ? 'col-md-6' : 'col-md-12'}`}>
                                        <div className="card details-card">
                                            <div className="card-header">
                                                <h5 className="card-title">Détails de la transaction</h5>
                                            </div>
                                            <div className="card-body">
                                                <div className="detail-row">
                                                    <span className="detail-label">Type de transaction</span>
                                                    <span className="detail-value">
                                                        {transaction.transaction_type?.name || 'N/A'}
                                                    </span>
                                                </div>
                                                <div className="detail-row">
                                                    <span className="detail-label">Date de la transaction</span>
                                                    <span className="detail-value">
                                                        {formatDateTime(transaction.created_at)}
                                                    </span>
                                                </div>
                                                <div className="detail-row">
                                                    <span className="detail-label">{getPartnerRoleName(transaction?.partner?.role?.name)}</span>
                                                    <span className="detail-value">
                                                        {transaction.partner?.name || 'N/A'}
                                                    </span>
                                                </div>
                                                <div className="detail-row">
                                                    <span className="detail-label">Email du {getPartnerRoleName(transaction?.partner?.role?.name)} </span>
                                                    <span className="detail-value">
                                                        {transaction.partner?.email || 'N/A'}
                                                    </span>
                                                </div>
                                                <div className="detail-row">
                                                    <span className="detail-label">Utilisateur ayant effectué la transaction</span>
                                                    <span className="detail-value">
                                                        {transaction.user_phone_number || 'N/A'}
                                                    </span>
                                                </div>
                                                <div className="detail-row">
                                                    <span className="detail-label">Contact du {getPartnerRoleName(transaction?.partner?.role?.name)}</span>
                                                    <span className="detail-value">
                                                        {transaction.partner?.phone || 'N/A'}
                                                    </span>
                                                </div>
                                                <div className="detail-row">
                                                    <span className="detail-label">Méthode de transaction</span>
                                                    <span className="detail-value">
                                                        {transaction.transaction_type?.name === 'PAYIN' ? getServiceName(transaction.service_code) : getPayoutServiceName(transaction.service_code)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Payment Summary Card */}
                                    {transaction.status_id === 3 && (
                                        <div className="col-md-6">
                                            <div className="card details-card">
                                                <div className="card-header">
                                                    <h5 className="card-title">Résumé du paiement</h5>
                                                </div>
                                                <div className="card-body">
                                                    <div className="detail-row">
                                                        <span className="detail-label">Montant de la transaction</span>
                                                        <span className="detail-value">
                                                            {formatAmount(transaction.amount)}
                                                        </span>
                                                    </div>
                                                    <div className="detail-row">
                                                        <span className="detail-label">Frais de transaction</span>
                                                        <span className="detail-value">
                                                            {transaction.partner?.fees[0]?.value} {transaction.partner?.fees[0]?.type === 'percentage' ? '%' : 'FCFA'}
                                                        </span>
                                                    </div>
                                                    <div className="detail-row">
                                                        <span className="detail-label">Commissions par partenaire</span>
                                                        <div className="detail-value">
                                                            {commission && commission.length > 0 ? (
                                                                <ul className="commission-list">
                                                                    {commission.map((commissionItem, index) => (
                                                                        <li key={commissionItem.id || index} className="commission-item">
                                                                            <span className="commission-text">
                                                                                {commissionItem.value} {transaction.partner?.fees[0]?.type === 'percentage' ? '%' : 'FCFA'} pour le partenaire :
                                                                                <Link
                                                                                    to={`/partners/details/${commissionItem.partner_id}`}
                                                                                    className="commission-link"
                                                                                >
                                                                                    {commissionItem.partner.name}
                                                                                </Link>
                                                                            </span>
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            ) : (
                                                                <span className="text-muted">Aucune commission</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="detail-row">
                                                        <span className="detail-label">Montant de la transaction après déduction des frais</span>
                                                        <span className="detail-value">
                                                            {formatAmount(calculateNetAmount(transaction.amount, transaction.partner?.fees[0]?.value, transaction.partner?.fees[0]?.type))}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Additional Information */}
                                <div className="row mt-4">
                                    <div className="col-12">
                                        <div className="card details-card">
                                            <div className="card-header">
                                                <h5 className="card-title">Informations supplémentaires</h5>
                                            </div>
                                            <div className="card-body">
                                                <div className="row">
                                                    <div className="col-md-6">
                                                        <div className="detail-row">
                                                            <span className="detail-label">Motif</span>
                                                            <span className="detail-value">
                                                                {transaction.motif || 'N/A'}
                                                            </span>
                                                        </div>
                                                        <div className="detail-row">
                                                            <span className="detail-label">Code de service</span>
                                                            <span className="detail-value">
                                                                {transaction.transaction_type?.name === 'PAYIN' ? getServiceName(transaction.service_code) : getPayoutServiceName(transaction.service_code)}
                                                            </span>
                                                        </div>
                                                        <div className="detail-row">
                                                            <span className="detail-label">Statut</span>
                                                            <span className="detail-value">
                                                                {transaction.status?.label || 'N/A'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="col-md-6">
                                                        <div className="detail-row">
                                                            <span className="detail-label">Numéro de transaction partenaire</span>
                                                            <span className="detail-value">
                                                                {transaction.partner_transaction_number || 'N/A'}
                                                            </span>
                                                        </div>
                                                        <div className="detail-row">
                                                            <span className="detail-label">Dernière mise à jour</span>
                                                            <span className="detail-value">
                                                                {formatDateTime(transaction.updated_at)}
                                                            </span>
                                                        </div>
                                                        <div className="detail-row">
                                                            <span className="detail-label">ID Transaction</span>
                                                            <span className="detail-value">
                                                                {transaction.id}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Callbacks Information */}
                                {transaction.partner?.callbacks && transaction.partner?.callbacks.length > 0 && (
                                    <div className="row mt-4">
                                        <div className="col-12">
                                            <div className="card details-card">
                                                <div className="card-header">
                                                    <h5 className="card-title">Callbacks de la transaction</h5>
                                                </div>
                                                <div className="card-body">
                                                    <div className="callbacks-list">
                                                        {transaction.partner?.callbacks.map((callback, index) => (
                                                            <div key={callback.id || index} className="callback-item">
                                                                <div className="callback-header">
                                                                    <h6 className="callback-title">
                                                                        Callback #{callback.id}
                                                                    </h6>
                                                                    <span className={`callback-status status-${callback.status_id}`}>
                                                                        {callback.status_id === 4 ? 'Échec' : 'Succès'}
                                                                    </span>
                                                                </div>
                                                                <div className="callback-details">
                                                                    <div className="detail-row">
                                                                        <span className="detail-label">Numéro de transaction externe</span>
                                                                        <span className="detail-value">
                                                                            {callback.external_transaction_number}
                                                                        </span>
                                                                    </div>
                                                                    <div className="detail-row">
                                                                        <span className="detail-label">Type de message</span>
                                                                        <span className="detail-value">
                                                                            {callback.message_type || 'N/A'}
                                                                        </span>
                                                                    </div>
                                                                    <div className="detail-row">
                                                                        <span className="detail-label">Date de création</span>
                                                                        <span className="detail-value">
                                                                            {formatDateTime(callback.created_at)}
                                                                        </span>
                                                                    </div>
                                                                    <div className="detail-row">
                                                                        <span className="detail-label">Message</span>
                                                                        <span className="detail-value">
                                                                            <code className="callback-message">
                                                                                {callback.message ?
                                                                                    JSON.stringify(JSON.parse(callback.message), null, 2)
                                                                                    : 'N/A'
                                                                                }
                                                                            </code>
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* API Response Information */}
                                <div className="row mt-4">
                                    <div className="col-12">
                                        <div className="card details-card">
                                            <div className="card-header">
                                                <h5 className="card-title">Informations techniques</h5>
                                            </div>
                                            <div className="card-body">
                                                <div className="row">
                                                    <div className="col-md-6">
                                                        <div className="detail-row">
                                                            <span className="detail-label">Message de requête</span>
                                                            <span className="detail-value">
                                                                <code className="small">
                                                                    {transaction.body_message ?
                                                                        JSON.stringify(JSON.parse(transaction.body_message), null, 2)
                                                                        : 'N/A'
                                                                    }
                                                                </code>
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="col-md-6">
                                                        <div className="detail-row">
                                                            <span className="detail-label">Réponse de l'API</span>
                                                            <span className="detail-value">
                                                                <code className="small">
                                                                    {transaction.response_body ?
                                                                        JSON.stringify(JSON.parse(transaction.response_body), null, 2)
                                                                        : 'N/A'
                                                                    }
                                                                </code>
                                                            </span>
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
        </Layout>
    );
};