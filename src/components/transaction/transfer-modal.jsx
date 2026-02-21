import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { jwtDecode } from 'jwt-decode';
import { getPaymentProviders, sendToastSuccess, sendToastError } from '../../helpers';
import { initiateTransferTransaction, initiateDirectTransfertTransaction } from '../../config/urls/transaction';
import { Loader } from '../loader';
import './index.css';

export const TransferModal = ({ show, onClose, availableBalance, transferType = 'partner' }) => {
    const token = useSelector(state => state.auth.token);
    const decodedPartnerId = jwtDecode(token);
    const [currentStep, setCurrentStep] = useState(1);
    const [selectedProvider, setSelectedProvider] = useState(null);
    const [amount, setAmount] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const paymentProviders = getPaymentProviders();

    // Réinitialiser le modal
    const resetModal = () => {
        setCurrentStep(1);
        setSelectedProvider(null);
        setAmount('');
        setPhoneNumber('');
        setErrors({});
    };

    const handleClose = () => {
        resetModal();
        onClose();
    };

    // Step 1: Sélection du moyen de paiement
    const handleProviderSelect = (provider) => {
        setSelectedProvider(provider);
        setCurrentStep(2);
    };

    // Step 2: Validation du montant
    const handleAmountValidation = () => {
        const newErrors = {};
        
        if (!amount || parseFloat(amount) <= 0) {
            newErrors.amount = 'Veuillez entrer un montant valide';
        } else if (parseFloat(amount) > availableBalance) {
            newErrors.amount = `Le montant ne peut pas dépasser ${availableBalance} FCFA`;
        }
    
        if (!phoneNumber || phoneNumber.length !== 10) {
            newErrors.phoneNumber = 'Le numéro de téléphone doit contenir exactement 10 chiffres';
        }
    
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }
    
        setErrors({});
        setCurrentStep(3);
    };

    // Step 3: Confirmation et transfert
    const handleTransfer = async () => {
        setLoading(true);
        try {
            const endpoint = transferType === 'aggregator' 
                ? initiateDirectTransfertTransaction 
                : initiateTransferTransaction;

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'x-api-key': import.meta.env.VITE_ADMIN_X_API_KEY
                },
                body: JSON.stringify({
                    transfertMethod: selectedProvider.code,
                    amount: parseFloat(amount),
                    phoneNumber
                })
            });
            const result = await response.json();

            if (result.success) {
                sendToastSuccess(result?.message || 'Transfert effectué avec succès !');
                handleClose();
                window.location.reload();
            } else {
                sendToastError(result?.message);
            }
        } catch (error) {
            sendToastError('Une erreur est survenue lors du transfert');
        } finally {
            setLoading(false);
        }
    };

    const handlePrevious = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
            setErrors({});
        }
    };

    if (!show) return null;

    return (
        <>
            <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
                <div className="modal-dialog modal-dialog-centered modal-lg">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">Transférer</h5>
                            {!loading && <button type="button" className="btn-close" onClick={handleClose}></button>}
                        </div>

                        <div className="modal-body">
                            {/* Progress Steps */}
                            <div className="transfer-steps mb-4">
                                <div className={`step ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
                                    <div className="step-number">1</div>
                                    <div className="step-label">Moyen de paiement</div>
                                </div>
                                <div className="step-line"></div>
                                <div className={`step ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
                                    <div className="step-number">2</div>
                                    <div className="step-label">Montant</div>
                                </div>
                                <div className="step-line"></div>
                                <div className={`step ${currentStep >= 3 ? 'active' : ''}`}>
                                    <div className="step-number">3</div>
                                    <div className="step-label">Confirmation</div>
                                </div>
                            </div>

                            {/* Step 1: Sélection du moyen de paiement */}
                            {currentStep === 1 && (
                                <div className="step-content">
                                    <h6 className="mb-3">Choisissez votre moyen de transfert</h6>
                                    <div className="row g-3">
                                        {paymentProviders.map((provider) => (
                                            <div key={provider.id} className="col-md-6">
                                                <div
                                                    className="payment-provider-card"
                                                    onClick={() => handleProviderSelect(provider)}
                                                >
                                                    <img
                                                        src={provider.img_provider}
                                                        alt={provider.name}
                                                        className="provider-logo"
                                                    />
                                                    <span className="provider-name">{provider.name}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Step 2: Saisie du montant */}
                            {currentStep === 2 && (
                                <div className="step-content">
                                    <div className="selected-provider mb-4">
                                        <img
                                            src={selectedProvider?.img_provider}
                                            alt={selectedProvider?.name}
                                            className="provider-logo-small"
                                        />
                                        <span className="ms-2">{selectedProvider?.name}</span>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label">Numéro de téléphone</label>
                                        <input
                                            type="text"
                                            className={`form-control ${errors.phoneNumber ? 'is-invalid' : ''}`}
                                            placeholder="Ex: 0712345678"
                                            value={phoneNumber}
                                            onChange={(e) => {
                                                // N'accepter que les chiffres
                                                const value = e.target.value.replace(/[^0-9]/g, '');
                                                setPhoneNumber(value);
                                                setErrors({ ...errors, phoneNumber: '' });
                                            }}
                                            maxLength="10"
                                        />
                                        {errors.phoneNumber && (
                                            <div className="invalid-feedback d-block">{errors.phoneNumber}</div>
                                        )}
                                        <small className="text-muted">10 chiffres maximum</small>
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Montant à transférer</label>
                                        <div className="input-group">
                                            <input
                                                type="text"
                                                className={`form-control ${errors.amount ? 'is-invalid' : ''}`}
                                                placeholder="0"
                                                value={amount}
                                                onChange={(e) => {

                                                    let value = e.target.value;

                                                    value = value.replace(',', '.');

                                                    value = value.replace(/[^0-9.]/g, '');

                                                    // Empêcher plusieurs points
                                                    const parts = value.split('.');
                                                    if (parts.length > 2) {
                                                        value = parts[0] + '.' + parts.slice(1).join('');
                                                    }

                                                    // Limiter à 2 décimales
                                                    if (parts.length === 2 && parts[1].length > 2) {
                                                        value = parts[0] + '.' + parts[1].substring(0, 2);
                                                    }

                                                    setAmount(value);
                                                    setErrors({ ...errors, amount: '' });
                                                }}
                                                onBlur={(e) => {
                                                    // Formater le nombre au blur (optionnel)
                                                    if (e.target.value && !isNaN(parseFloat(e.target.value))) {
                                                        const formatted = parseFloat(e.target.value).toFixed(2);
                                                        setAmount(formatted);
                                                    }
                                                }}
                                            />
                                            <span className="input-group-text">FCFA</span>
                                        </div>
                                        {errors.amount && (
                                            <div className="invalid-feedback d-block">{errors.amount}</div>
                                        )}
                                        <small className="text-muted">
                                            Solde disponible: <strong>{availableBalance.toLocaleString('fr-FR')} FCFA</strong>
                                        </small>
                                    </div>
                                </div>
                            )}
                            {/* Step 3: Résumé et confirmation */}
                            {currentStep === 3 && (
                                <div className="step-content">
                                    <h6 className="mb-3">Résumé du transfert</h6>
                                    <div className="transfer-summary">
                                        <div className="summary-item">
                                            <span className="summary-label">Moyen de transfert</span>
                                            <div className="summary-value">
                                                <img
                                                    src={selectedProvider?.img_provider}
                                                    alt={selectedProvider?.name}
                                                    className="provider-logo-tiny"
                                                />
                                                <span className="ms-2">{selectedProvider?.name}</span>
                                            </div>
                                        </div>
                                        <div className="summary-item">
                                            <span className="summary-label">Numéro de téléphone destinataire</span>
                                            <span className="summary-value">{phoneNumber}</span>
                                        </div>
                                        <div className="summary-item">
                                            <span className="summary-label">Montant</span>
                                            <span className="summary-value fw-bold">{parseFloat(amount).toLocaleString('fr-FR')} FCFA</span>
                                        </div>
                                    </div>

                                    {errors.transfer && (
                                        <div className="alert alert-danger mt-3">{errors.transfer}</div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="modal-footer">
                            {currentStep > 1 && (
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={handlePrevious}
                                >
                                    Précédent
                                </button>
                            )}

                            {currentStep === 2 && (
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={handleAmountValidation}
                                >
                                    Valider
                                </button>
                            )}

                            {currentStep === 3 && (
                                loading ? <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}><Loader /></div> : <button
                                    type="button"
                                    className="btn btn-success"
                                    onClick={handleTransfer}
                                >
                                    Confirmer le transfert
                                </button> )}
                        </div>
                    </div>
                </div>
            </div>
            <div className="modal-backdrop fade show"></div>
        </>
    );
};