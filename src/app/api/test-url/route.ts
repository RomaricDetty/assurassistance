import { NextResponse } from "next/server";

export async function GET() {
  const baseApiUrl = process.env.NEXT_PUBLIC_API_URL;

  // Test de construction d'URL avec différents cas
  const testCases = [
    "users/1",
    "auth/login",
    "/api/users",
    "//double//slash",
    "",
    "auth/login-w", // Le cas problématique
  ];

  const results = testCases.map((testPath) => {
    try {
      // Nettoyer les slashes multiples
      const cleanPath = testPath.replace(/\/+/g, "/").replace(/^\//, "");
      const cleanBaseUrl = baseApiUrl?.replace(/\/+$/, "") || "";

      const finalUrl = `${cleanBaseUrl}/${cleanPath}`;

      // Valider l'URL
      const urlObj = new URL(finalUrl);

      return {
        input: testPath,
        output: finalUrl,
        valid: true,
        protocol: urlObj.protocol,
        host: urlObj.host,
        pathname: urlObj.pathname,
      };
    } catch (error) {
      return {
        input: testPath,
        output: "INVALID",
        valid: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  });

  return NextResponse.json({
    baseApiUrl,
    tests: results,
    summary: {
      total: testCases.length,
      valid: results.filter((r) => r.valid).length,
      invalid: results.filter((r) => !r.valid).length,
    },
  });
}
