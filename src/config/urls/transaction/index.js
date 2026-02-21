import { BASE_URL } from "../base";

export const getAllPayinTransactions = `${BASE_URL}/api/transaction/get-all-payin-transactions`;
export const getTransactionDetails = `${BASE_URL}/api/transaction/get-transaction-details`;
export const getAllPayoutTransactions = `${BASE_URL}/api/transaction/get-all-payout-transactions`;
export const getTransactionTypes = `${BASE_URL}/api/transaction/get-transaction-types`;
export const initiateTransferTransaction = `${BASE_URL}/api/transaction/initiate-transfert`;
export const initiateDirectTransfertTransaction = `${BASE_URL}/api/transaction/initiate-direct-transfert`;