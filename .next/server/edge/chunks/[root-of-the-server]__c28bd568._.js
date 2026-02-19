(globalThis.TURBOPACK = globalThis.TURBOPACK || []).push(["chunks/[root-of-the-server]__c28bd568._.js", {

"[externals]/node:buffer [external] (node:buffer, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("node:buffer", () => require("node:buffer"));

module.exports = mod;
}}),
"[externals]/node:async_hooks [external] (node:async_hooks, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("node:async_hooks", () => require("node:async_hooks"));

module.exports = mod;
}}),
"[project]/src/lib/auth.ts [middleware-edge] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
/* eslint-disable @typescript-eslint/no-explicit-any */ __turbopack_context__.s({
    "auth": (()=>auth),
    "handlers": (()=>handlers),
    "signIn": (()=>signIn),
    "signOut": (()=>signOut)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$2d$auth$40$5$2e$0$2e$0$2d$beta$2e$27_next$40$15$2e$3$2e$1_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2d$auth$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next-auth@5.0.0-beta.27_next@15.3.1_react-dom@19.2.0_react@19.2.0__react@19.2.0__react@19.2.0/node_modules/next-auth/index.js [middleware-edge] (ecmascript) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$2d$auth$40$5$2e$0$2e$0$2d$beta$2e$27_next$40$15$2e$3$2e$1_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2d$auth$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next-auth@5.0.0-beta.27_next@15.3.1_react-dom@19.2.0_react@19.2.0__react@19.2.0__react@19.2.0/node_modules/next-auth/index.js [middleware-edge] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$2d$auth$40$5$2e$0$2e$0$2d$beta$2e$27_next$40$15$2e$3$2e$1_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2d$auth$2f$providers$2f$credentials$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next-auth@5.0.0-beta.27_next@15.3.1_react-dom@19.2.0_react@19.2.0__react@19.2.0__react@19.2.0/node_modules/next-auth/providers/credentials.js [middleware-edge] (ecmascript) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$39$2e$0$2f$node_modules$2f40$auth$2f$core$2f$providers$2f$credentials$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@auth+core@0.39.0/node_modules/@auth/core/providers/credentials.js [middleware-edge] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$2d$auth$40$5$2e$0$2e$0$2d$beta$2e$27_next$40$15$2e$3$2e$1_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2d$auth$2f$jwt$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next-auth@5.0.0-beta.27_next@15.3.1_react-dom@19.2.0_react@19.2.0__react@19.2.0__react@19.2.0/node_modules/next-auth/jwt.js [middleware-edge] (ecmascript) <module evaluation>");
;
;
;
async function login(credentials) {
    try {
        // Nettoyer les credentials pour ne pas envoyer les champs NextAuth
        const { phone, password } = credentials;
        const cleanCredentials = {
            phone,
            password
        };
        console.log("Envoi de la requête vers:", "/auth/login-w");
        console.log("Credentials nettoyés:", cleanCredentials);
        // Configuration SSL pour accepter les certificats auto-signés
        // Ceci s'exécute côté serveur dans NextAuth
        if (typeof process !== "undefined") {
            process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
            console.log("🔓 SSL verification disabled for self-signed certificates");
        }
        // Appel direct à l'API backend depuis le serveur
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        if (!apiUrl) {
            throw new Error("NEXT_PUBLIC_API_URL is not configured");
        }
        console.log("API URL:", apiUrl);
        const res = await fetch(`${apiUrl}/auth/login-w`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify(cleanCredentials)
        });
        console.log("Response status:", res.status);
        if (!res.ok) {
            const errorData = await res.json().catch(()=>({}));
            // Vérifier si c'est une erreur 401 de type "User must update password"
            if (res.status === 401 && errorData.message === "User must update password") {
                return {
                    error: "password_update_required",
                    phone: credentials.phone
                };
            }
            console.log("Erreur de l'API:", errorData);
            throw new Error(errorData.message || "Erreur de connexion");
        }
        const body = await res.json();
        const { token, permissions, phone: userPhone, id } = body;
        console.log("Response", body);
        // S'assurer que toutes les données nécessaires sont présentes
        if (!token || !id) {
            console.log("Réponse invalide de l'API", body);
            throw new Error("Réponse invalide de l'API");
        }
        return {
            token,
            permissions,
            phone: userPhone,
            id
        };
    } catch (e) {
        console.error("Erreur de connexion:", e);
        // Retourner l'erreur spécifique de l'API si disponible
        if (e.message && !e.message.includes("fetch failed")) {
            throw new Error(e.message);
        }
        throw new Error("Erreur de connexion. Vérifiez vos identifiants.");
    }
}
const { handlers, signIn, signOut, auth } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$2d$auth$40$5$2e$0$2e$0$2d$beta$2e$27_next$40$15$2e$3$2e$1_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2d$auth$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__$3c$locals$3e$__["default"])({
    secret: process.env.NEXTAUTH_SECRET || "DSHpAKMwKkLIfaZyQ8jYx/Yl4zl1WpRrG42rXWWs18Q=",
    pages: {
        signIn: "/login",
        signOut: "/login",
        error: "/login"
    },
    providers: [
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$auth$2b$core$40$0$2e$39$2e$0$2f$node_modules$2f40$auth$2f$core$2f$providers$2f$credentials$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["default"])({
            name: "credentials",
            // You can specify which fields should be submitted, by adding keys to the `credentials` object.
            // e.g. domain, username, password, 2FA token, etc.
            credentials: {
                phone: {},
                password: {}
            },
            authorize: async (credentials)=>{
                try {
                    const user = await login(credentials);
                    // Vérifier si c'est l'erreur spécifique de mot de passe à mettre à jour
                    if (user && user.error === "password_update_required") {
                        // Lancer une erreur custom au lieu de retourner un string
                        throw new Error("password_update_required");
                    }
                    return {
                        id: user.id,
                        phone: user.phone,
                        name: user.permissions,
                        token: user.token
                    };
                } catch (e) {
                    console.error("Erreur d'autorisation:", e);
                    // Si c'est l'erreur de mise à jour de mot de passe, on la propage
                    if (e.message === "password_update_required") {
                        throw e;
                    }
                    return null;
                }
            }
        })
    ],
    callbacks: {
        async jwt ({ token, user }) {
            // Lorsqu'un utilisateur se connecte
            if (user) {
                token.accessToken = user.token;
                token.id = user.id;
                token.phone = user.phone;
                // Stocker le token dans sessionStorage pour les requêtes API
                if ("TURBOPACK compile-time falsy", 0) {
                    "TURBOPACK unreachable";
                }
            }
            return token;
        },
        async session ({ session, token }) {
            // Ajout du token à la session pour qu'il soit accessible côté client
            session.accessToken = token.accessToken;
            session.id = token.id;
            session.phone = token.phone;
            // Stocker le token dans sessionStorage pour les requêtes API
            if ("TURBOPACK compile-time falsy", 0) {
                "TURBOPACK unreachable";
            }
            return session;
        }
    },
    session: {
        strategy: "jwt"
    },
    debug: ("TURBOPACK compile-time value", "development") === "development"
});
}}),
"[project]/src/middleware.ts [middleware-edge] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "config": (()=>config),
    "default": (()=>__TURBOPACK__default__export__)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/auth.ts [middleware-edge] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$3$2e$1_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$esm$2f$api$2f$server$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@15.3.1_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/esm/api/server.js [middleware-edge] (ecmascript) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$3$2e$1_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$spec$2d$extension$2f$response$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@15.3.1_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/esm/server/web/spec-extension/response.js [middleware-edge] (ecmascript)");
;
;
const __TURBOPACK__default__export__ = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["auth"])((req)=>{
    // Redirect to login if not authenticated and not already on login page
    if (!req.auth && req.nextUrl.pathname !== "/login") {
        const newUrl = new URL("/login", req.nextUrl.origin);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$3$2e$1_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$spec$2d$extension$2f$response$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].redirect(newUrl);
    }
    // Redirect to dashboard if authenticated and not already on dashboard page
    if (req.auth && !req.nextUrl.pathname.includes("/dashboard")) {
        const newUrl = new URL("/dashboard", req.nextUrl.origin);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$3$2e$1_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$spec$2d$extension$2f$response$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].redirect(newUrl);
    }
    // Redirect to login if error credentials
    if (req.nextUrl.searchParams.get("error") === "CredentialsSignin") {
        const newUrl = new URL("/login", req.nextUrl.origin);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$3$2e$1_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$spec$2d$extension$2f$response$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].redirect(newUrl);
    }
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$3$2e$1_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$spec$2d$extension$2f$response$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].next();
});
const config = {
    matcher: [
        /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */ "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)"
    ]
};
}}),
}]);

//# sourceMappingURL=%5Broot-of-the-server%5D__c28bd568._.js.map