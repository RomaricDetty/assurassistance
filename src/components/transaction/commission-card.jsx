import { useState } from 'react';

import { TransferModal } from './transfer-modal';
import { Loader } from "../loader";

export const CommissionCard = ({
    loadingPartnerBalance,
    errorPartnerBalance,
    partnerBalance
}) => {

    const [showTransferModal, setShowTransferModal] = useState(false);
    return (
        <>
            <div className="col-md-12 col-lg-6 mb-3">
                <div className="card bg-globe-img h-100">
                    {loadingPartnerBalance ? <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}><Loader /></div> : <div className="card-body d-flex flex-column justify-content-between h-100">
                        <div>
                            <div className="d-flex justify-content-between align-items-center">
                                <span className="fs-16 fw-semibold">Commissions OrionNode</span>
                            </div>
                            {errorPartnerBalance ? <p className="text-danger">{errorPartnerBalance}</p> : <>
                            {partnerBalance?.amount ? <h4 className="my-2 fs-24 fw-semibold">{partnerBalance?.amount} FCFA</h4> : <h4 className="my-2 fs-24 fw-semibold">0 FCFA</h4>}
                                <p className="text-muted small mb-2">Cumul des commissions marchands</p>
                            </>
                            }
                        </div>
                        <div className="mt-auto">
                            {!errorPartnerBalance && (
                                <button 
                                    type="button" 
                                    className="btn btn-soft-primary"
                                    onClick={() => setShowTransferModal(true)}>
                                    Transférer
                                </button>
                            )}
                        </div>
                    </div>}
                </div>
            </div>
            {/* Modal de transfert */}
            <TransferModal 
                show={showTransferModal}
                onClose={() => setShowTransferModal(false)}
                availableBalance={partnerBalance?.amount || 0}
                transferType="partner"
            />
        </>
    )
}