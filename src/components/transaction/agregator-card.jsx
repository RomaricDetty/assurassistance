import React from 'react';
import { TransferModal } from './transfer-modal';
import { Loader } from '../loader';
import { useState } from 'react';

export const AgregatorCard = ({
    loadingMainBalance,
    errorMainBalance,
    mainBalance
}) => {
    const [showTransferModal, setShowTransferModal] = useState(false);
    return (
        <>
            <div className="col-md-12 col-lg-6 mb-3">
                <div className="card bg-globe-img h-100">
                    {loadingMainBalance ?
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}><Loader /></div>
                        :
                        <div className="card-body d-flex flex-column justify-content-between h-100">
                            <div>
                                <div className="d-flex justify-content-between align-items-center">
                                    <span className="fs-16 fw-semibold">Compte technique</span>
                                </div>
                                {errorMainBalance ? <p className="text-danger">{errorMainBalance}</p> : <>
                                {mainBalance ? <h4 className="my-2 fs-24 fw-semibold">{mainBalance} <small className="font-14">FCFA</small></h4> : <h4 className="my-2 fs-24 fw-semibold">0 FCFA</h4>}
                                    <p className="text-muted small mb-2">Solde de l'agrégateur financier</p>
                                </>
                                }
                            </div>
                            <div className="mt-auto">
                                {errorMainBalance && (
                                    <>
                                        <button type="button" className="btn btn-soft-primary me-2" onClick={() => setShowTransferModal(true)}>Transférer</button>
                                    </>
                                )}
                            </div>
                        </div>}
                </div>
            </div>
            {/* Modal de transfert */}
            <TransferModal
                show={showTransferModal}
                onClose={() => setShowTransferModal(false)}
                availableBalance={mainBalance?.amount || 0}
                transferType="aggregator"
            />
        </>
    )
}