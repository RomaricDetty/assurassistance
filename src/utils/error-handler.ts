import { AxiosError } from "axios";

export interface ErrorInfo {
  message: string;
  status?: number;
  code?: string;
  isNetworkError: boolean;
  isServerError: boolean;
  isClientError: boolean;
}

export function handleApiError(error: unknown): ErrorInfo {
  // Cas par défaut
  let errorInfo: ErrorInfo = {
    message: "Une erreur inconnue s'est produite",
    isNetworkError: false,
    isServerError: false,
    isClientError: false,
  };

  if (error instanceof AxiosError) {
    // Erreur Axios
    if (!error.response) {
      // Erreur réseau (pas de réponse du serveur)
      errorInfo = {
        message: "Erreur de connexion au serveur",
        code: error.code,
        isNetworkError: true,
        isServerError: false,
        isClientError: false,
      };
      
      // Cas spécifiques
      if (error.message.includes("timeout")) {
        errorInfo.message = "La requête a expiré";
      } else if (error.message.includes("Network Error")) {
        errorInfo.message = "Erreur réseau";
      } else if (error.message.includes("SSL") || error.message.includes("CERT")) {
        errorInfo.message = "Erreur de certificat SSL";
      }
    } else {
      // Erreur avec réponse du serveur
      const status = error.response.status;
      errorInfo = {
        message: error.response.data?.message || error.message,
        status,
        isNetworkError: false,
        isServerError: status >= 500,
        isClientError: status >= 400 && status < 500,
      };

      // Messages spécifiques selon le code de statut
      switch (status) {
        case 401:
          errorInfo.message = "Non autorisé - Veuillez vous connecter";
          break;
        case 403:
          errorInfo.message = "Accès interdit";
          break;
        case 404:
          errorInfo.message = "Ressource introuvable";
          break;
        case 429:
          errorInfo.message = "Trop de requêtes - Veuillez patienter";
          break;
        case 500:
          errorInfo.message = "Erreur interne du serveur";
          break;
        case 502:
          errorInfo.message = "Serveur indisponible";
          break;
        case 503:
          errorInfo.message = "Service temporairement indisponible";
          break;
      }
    }
  } else if (error instanceof Error) {
    // Erreur JavaScript standard
    errorInfo = {
      message: error.message,
      isNetworkError: false,
      isServerError: false,
      isClientError: false,
    };
  }

  return errorInfo;
}

export function logError(error: unknown, context?: string) {
  const errorInfo = handleApiError(error);
  const prefix = context ? `[${context}]` : "";
  
  console.error(`${prefix} Erreur détectée:`, {
    message: errorInfo.message,
    status: errorInfo.status,
    code: errorInfo.code,
    type: errorInfo.isNetworkError ? "Network" : 
          errorInfo.isServerError ? "Server" : 
          errorInfo.isClientError ? "Client" : "Unknown",
    originalError: error
  });
}

export function shouldRetry(error: unknown): boolean {
  const errorInfo = handleApiError(error);
  
  // Retry pour les erreurs réseau et certaines erreurs serveur
  return errorInfo.isNetworkError || 
         errorInfo.status === 500 || 
         errorInfo.status === 502 || 
         errorInfo.status === 503;
} 