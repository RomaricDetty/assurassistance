import axios from "axios";
import { logError } from "@/utils/error-handler";

// Fonction pour obtenir la baseURL correcte
const getBaseURL = () => {
  // Côté client: utiliser le proxy Next.js
  if (typeof window !== "undefined") {
    return "/api/proxy";
  }
  
  // Côté serveur: appeler directement l'API backend
  // Évite les problèmes de Vercel Deployment Protection
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  
  if (apiUrl) {
    console.log("📡 Axios côté serveur : appel direct à l'API backend");
    // Configurer SSL pour accepter les certificats auto-signés
    if (typeof process !== "undefined") {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    }
    return apiUrl;
  }
  
  // Fallback pour le développement local
  if (process.env.NODE_ENV === "development") {
    return "http://localhost:3001/api/proxy";
  }
  
  console.warn("⚠️ NEXT_PUBLIC_API_URL non défini");
  return "/api/proxy";
};

// Vérifier que l'API externe utilise HTTPS et afficher la config
if (typeof window === "undefined" && process.env.NEXT_PUBLIC_API_URL) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const baseURL = getBaseURL();
  
  console.log("🔧 Configuration Axios:");
  console.log("  - API Backend:", apiUrl);
  console.log("  - Proxy URL:", baseURL);
  console.log("  - Environment:", process.env.NODE_ENV);
  console.log("  - VERCEL_URL:", process.env.VERCEL_URL || "non défini");
  
  if (!apiUrl.startsWith("https://")) {
    console.warn("⚠️  ATTENTION: L'API externe n'utilise pas HTTPS:", apiUrl);
    console.warn("🔒 Recommandation: Utilisez HTTPS pour sécuriser les communications");
  } else {
    console.log("✅ API externe configurée avec HTTPS");
  }
}

const $axios = axios.create({
  baseURL: getBaseURL(),
  // timeout: 5000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Enable sending cookies in cross-origin requests
});

$axios.interceptors.request.use((config) => {
  // Récupérer le token depuis sessionStorage (utilisé par NextAuth)
  const token =
    typeof window !== "undefined" ? sessionStorage.getItem("auth_token") : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Logging des informations de la requête
  console.log(`Requête envoyée: ${config.method?.toUpperCase()} ${config.url}`);
  console.log("Headers:", config.headers);
  console.log("Données:", config.data);

  return config;
});

// Intercepteur pour logger les réponses et gérer les erreurs d'authentification
$axios.interceptors.response.use(
  (response) => {
    console.log(`Réponse reçue: ${response.status} ${response.config.url}`);
    console.log("Données de réponse:", response.data);
    return response;
  },
  async (error) => {
    // Vérifier que error.config existe avant d'essayer de l'utiliser
    if (!error.config) {
      logError(error, "Axios (no config)");
      return Promise.reject(error);
    }

    const originalRequest = error.config;

    // Logging des erreurs avec le gestionnaire d'erreurs
    logError(error, `Axios ${originalRequest.method?.toUpperCase()} ${originalRequest.url}`);

    // Éviter les boucles infinies de requêtes
    if (originalRequest._retry) {
      return Promise.reject(error);
    }

    // Si l'erreur est une erreur d'authentification (401)
    /*  if (error.response && error.response.status === 401) {
           originalRequest._retry = true;

           console.warn("Session expirée ou non autorisée");

           // Si on est côté client, on peut déconnecter l'utilisateur
           if (typeof window !== "undefined") {
             // On attend un peu pour ne pas déconnecter immédiatement pendant une navigation
             setTimeout(() => {
               // Vérifier si l'utilisateur est toujours sur la même page avant de le déconnecter
               signOut({ redirect: true, callbackUrl: "/login" }).catch(
                 console.error
               );
             }, 2000);
           }
         } */

    return Promise.reject(error);
  }
);

export default $axios;
