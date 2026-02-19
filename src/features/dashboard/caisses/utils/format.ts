export const renderTransactionType = (type: string) => {
    switch (type) {
        case "TRANSFER_IN":
            return "Transfert entrant";
        case "TRANSFER_OUT":
            return "Transfert sortant";
        case "DEPOSIT":
            return "Dépot";
        case "WITHDRAWAL":
            return "Retrait";
    }
};

export const renderCaisseActiveInactive = (status: string) => {
    switch (status) {
        case "true":
            return "caisse active";
        case "false":
            return "caisse inactive";
    }
}

export const renderCaisseFermeeOuverte = (status: string) => {
    switch (status) {
        case "true":
            return "caisse fermée";
        case "false":
            return "caisse ouverte";
    }
}
