
// Fonction pour valider et nettoyer l'URL du logo
export const validateAndCleanImageUrl = (logoUrl, defaultImage) => {
    // Si pas de logo, retourner l'avatar par défaut
    if (!logoUrl || logoUrl === '') {
        return defaultImage
    }

    // Nettoyer le préfixe "url:" si présent
    let cleanUrl = logoUrl.trim()
    if (cleanUrl.startsWith('url:')) {
        cleanUrl = cleanUrl.replace('url:', '').trim()
    }
    
    // Extensions d'images valides
    const validImageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.ico']
    
    // Vérifier si c'est une URL valide avec l'API native URL
    try {
        const urlObject = new URL(cleanUrl)
        
        // Vérifier si le protocole est http ou https
        if (urlObject.protocol !== "http:" && urlObject.protocol !== "https:") {
            return defaultImage
        }
        
        // Extraire le chemin et vérifier l'extension
        const pathname = urlObject.pathname.toLowerCase()
        const hasValidExtension = validImageExtensions.some(ext => pathname.endsWith(ext))
        
        if (!hasValidExtension) {
            return defaultImage
        }
        
        return cleanUrl // URL valide avec extension d'image
        
    } catch (error) {
        // Si ce n'est pas une URL valide, vérifier si c'est un chemin relatif
        if (cleanUrl.startsWith('/') || cleanUrl.startsWith('./')) {
            // Vérifier l'extension pour les chemins relatifs aussi
            const hasValidExtension = validImageExtensions.some(ext => 
                cleanUrl.toLowerCase().endsWith(ext)
            )
            
            if (hasValidExtension) {
                return cleanUrl
            } else {
                return defaultImage
            }
        }
        return defaultImage
    }
}


export const formatDateLocalFr = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    })
}

export const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

export const formatAmount = (amount) => {
    if (!amount) return '0 FCFA';
    return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
};

// Fonction pour obtenir les dates du mois en cours
export const getCurrentMonthDates = () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    return {
        start_date: startOfMonth.toISOString().split('T')[0],
        end_date: endOfMonth.toISOString().split('T')[0]
    };
};
