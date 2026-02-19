export const renderTransactionType = (type: string) => {
    switch (type) {
        case "TRANSFER_IN":
            return "Transfert entrant";
        case "TRANSFER_OUT":
            return "Transfert sortant";
        case "DEPOSIT":
            return "Dépôt";
        case "WITHDRAWAL":
            return "Retrait";
        case "CASHDESK_ALLOCATION":
            return "Allocation à la caisse";
        case "REVERSE_CASHDESK_ALLOCATION":
            return "Retour de fonds";
        case "PAID":
            return "Paiement";
        default:
            return type;
    }
};
