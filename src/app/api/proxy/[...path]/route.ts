import { NextRequest, NextResponse } from "next/server";

// Configuration pour accepter les certificats SSL auto-signés
// IMPORTANT: En production, utilisez un certificat SSL valide
const configureSSL = () => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
  const isHttps = apiUrl.startsWith("https://");
  
  // Si l'API utilise HTTPS, configurer pour accepter les certificats auto-signés
  if (isHttps && typeof process !== "undefined") {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    console.log("🔓 SSL verification disabled for self-signed certificates");
  }
};

// Configurer SSL au chargement du module
configureSSL();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  const path = resolvedParams.path.join("/");
  const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/${path}`;
  const searchParams = new URL(request.url).searchParams.toString();
  const url = searchParams ? `${apiUrl}?${searchParams}` : apiUrl;

  // Headers essentiels seulement
  const headers = new Headers();
  headers.set("Accept", "application/json");
  headers.set("User-Agent", "Next.js Proxy");
  
  // Forward Authorization si présent
  const authHeader = request.headers.get("authorization");
  if (authHeader) {
    headers.set("Authorization", authHeader);
  }

  try {
    const response = await fetch(url, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Erreur de serveur" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Erreur de proxy:", error);
    return NextResponse.json(
      { error: "Échec de récupération des données" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  const path = resolvedParams.path.join("/");
  const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/${path}`;

  console.log("🔄 Proxy POST Request:");
  console.log("- Path:", path);
  console.log("- API URL:", apiUrl);

  // Headers essentiels seulement
  const headers = new Headers();
  headers.set("Accept", "application/json");
  headers.set("User-Agent", "Next.js Proxy");
  
  // Forward Authorization si présent
  const authHeader = request.headers.get("authorization");
  if (authHeader) {
    headers.set("Authorization", authHeader);
  }

  // Gérer le Content-Type
  const contentType = request.headers.get("content-type");
  if (contentType) {
    headers.set("Content-Type", contentType);
  }

  try {
    const upstream = await fetch(apiUrl, {
      method: "POST",
      headers,
      body: request.body as BodyInit,
      // @ts-expect-error - duplex option is required for streaming in Node.js
      duplex: "half",
    });

    console.log("✅ Response status:", upstream.status);

    const resHeaders = new Headers(upstream.headers);
    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers: resHeaders,
    });
  } catch (error) {
    console.error("❌ Erreur de proxy:", error);
    
    // Log détaillé pour les erreurs SSL
    if (error instanceof Error && error.message.includes("certificate")) {
      console.error("🔒 Erreur de certificat SSL détectée");
      console.error("   API URL:", apiUrl);
      console.error("   NODE_TLS_REJECT_UNAUTHORIZED:", process.env.NODE_TLS_REJECT_UNAUTHORIZED);
    }
    
    return NextResponse.json(
      { error: "Échec de traitement de la requête", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  const path = resolvedParams.path.join("/");
  const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/${path}`;

  // Headers essentiels seulement
  const headers = new Headers();
  headers.set("Accept", "application/json");
  headers.set("User-Agent", "Next.js Proxy");
  
  // Forward Authorization si présent
  const authHeader = request.headers.get("authorization");
  if (authHeader) {
    headers.set("Authorization", authHeader);
  }

  // Gérer le Content-Type
  const contentType = request.headers.get("content-type");
  if (contentType) {
    headers.set("Content-Type", contentType);
  }

  try {
    const upstream = await fetch(apiUrl, {
      method: "PUT",
      headers,
      body: request.body as BodyInit,
      // @ts-expect-error - duplex option is required for streaming in Node.js
      duplex: "half",
    });

    const resHeaders = new Headers(upstream.headers);
    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers: resHeaders,
    });
  } catch (error) {
    console.error("Erreur de proxy:", error);
    return NextResponse.json(
      { error: "Échec de traitement de la requête" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  const path = resolvedParams.path.join("/");
  const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/${path}`;
  const searchParams = new URL(request.url).searchParams.toString();
  const url = searchParams ? `${apiUrl}?${searchParams}` : apiUrl;

  // Headers essentiels seulement
  const headers = new Headers();
  headers.set("Accept", "application/json");
  headers.set("User-Agent", "Next.js Proxy");
  
  // Forward Authorization si présent
  const authHeader = request.headers.get("authorization");
  if (authHeader) {
    headers.set("Authorization", authHeader);
  }

  try {
    const upstream = await fetch(url, {
      method: "DELETE",
      headers,
      body: request.body as BodyInit,
      // @ts-expect-error - duplex option is required for streaming in Node.js
      duplex: "half",
    });

    const resHeaders = new Headers(upstream.headers);
    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers: resHeaders,
    });
  } catch (error) {
    console.error("Erreur de proxy:", error);
    return NextResponse.json(
      { error: "Échec de suppression" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  const path = resolvedParams.path.join("/");
  const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/${path}`;

  // Headers essentiels seulement
  const headers = new Headers();
  headers.set("Accept", "application/json");
  headers.set("User-Agent", "Next.js Proxy");
  
  // Forward Authorization si présent
  const authHeader = request.headers.get("authorization");
  if (authHeader) {
    headers.set("Authorization", authHeader);
  }

  // Gérer le Content-Type
  const contentType = request.headers.get("content-type");
  if (contentType) {
    headers.set("Content-Type", contentType);
  }

  try {
    const upstream = await fetch(apiUrl, {
      method: "PATCH",
      headers,
      body: request.body as BodyInit,
      // @ts-expect-error - duplex option is required for streaming in Node.js
      duplex: "half",
    });

    const resHeaders = new Headers(upstream.headers);
    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers: resHeaders,
    });
  } catch (error) {
    console.error("Erreur de proxy:", error);
    return NextResponse.json(
      { error: "Échec de traitement de la requête" },
      { status: 500 }
    );
  }
}
