/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { testHttpsConnection } from "@/utils/https-test";

export default function TestHttpsPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleTest = async () => {
    setLoading(true);
    try {
      const testResult = await testHttpsConnection();
      setResult(testResult);
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Test de Configuration HTTPS</h1>
      
      <div className="space-y-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h2 className="font-semibold mb-2">Configuration actuelle</h2>
          <p><strong>API URL:</strong> {process.env.NEXT_PUBLIC_API_URL || "Non définie"}</p>
          <p><strong>Environment:</strong> {process.env.NODE_ENV}</p>
        </div>

        <button
          onClick={handleTest}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? "Test en cours..." : "Tester la connexion HTTPS"}
        </button>

        {result && (
          <div className={`p-4 rounded-lg ${result.success ? "bg-green-50" : "bg-red-50"}`}>
            <h3 className="font-semibold mb-2">
              {result.success ? "✅ Connexion réussie" : "❌ Échec de connexion"}
            </h3>
            
            {result.status && (
              <p><strong>Status HTTP:</strong> {result.status}</p>
            )}
            
            {result.error && (
              <div>
                <p><strong>Erreur:</strong> {result.error}</p>
                {result.error.includes("self-signed") && (
                  <div className="mt-2 p-2 bg-yellow-100 rounded">
                    <p className="text-sm">
                      <strong>💡 Solution:</strong> Votre serveur utilise un certificat SSL auto-signé. 
                      Ajoutez la variable d&apos;environnement <code>ALLOW_SELF_SIGNED_CERT=true</code> 
                      dans votre configuration Vercel pour résoudre ce problème.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-2">Instructions pour Vercel</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>Allez dans votre dashboard Vercel</li>
          <li>Sélectionnez votre projet</li>
          <li>Allez dans Settings → Environment Variables</li>
          <li>Ajoutez: <code>ALLOW_SELF_SIGNED_CERT</code> = <code>true</code></li>
          <li>Redéployez votre application</li>
        </ol>
      </div>
    </div>
  );
} 