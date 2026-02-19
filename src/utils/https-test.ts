/* eslint-disable @typescript-eslint/no-explicit-any */

// Utilitaire pour tester la connexion HTTPS vers l'API
export async function testHttpsConnection(): Promise<{
  success: boolean;
  status?: number;
  error?: string;
  certificateInfo?: any;
}> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    if (!apiUrl) {
      return {
        success: false,
        error: "NEXT_PUBLIC_API_URL n'est pas définie",
      };
    }

    console.log("🔍 Test de connexion HTTPS vers:", apiUrl);

    const response = await fetch(`${apiUrl}/health`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    return {
      success: response.ok,
      status: response.status,
      error: response.ok
        ? undefined
        : `HTTP ${response.status}: ${response.statusText}`,
    };
  } catch (error) {
    console.error("❌ Erreur de test HTTPS:", error);

    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: false,
      error: "Erreur inconnue lors du test HTTPS",
    };
  }
}

// Fonction pour vérifier si l'URL utilise HTTPS
export function isHttpsUrl(url: string): boolean {
  return url.startsWith("https://");
}

// Fonction pour convertir HTTP en HTTPS
export function forceHttps(url: string): string {
  return url.replace(/^http:\/\//, "https://");
}
