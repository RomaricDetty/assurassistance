/* eslint-disable @typescript-eslint/no-explicit-any */
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import "next-auth/jwt";

// Étendre les types
declare module "next-auth" {
  interface User {
    token?: string;
    permissions?: string;
    phone?: string;
  }

  interface Session {
    accessToken?: string;
    id?: string;
    phone?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    id?: string;
    phone?: string;
  }
}

async function login(credentials: any) {
  try {
    // Nettoyer les credentials pour ne pas envoyer les champs NextAuth
    const { phone, password } = credentials;
    const cleanCredentials = { phone, password };

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
        "Accept": "application/json",
      },
      body: JSON.stringify(cleanCredentials),
    });

    console.log("Response status:", res.status);

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      
      // Vérifier si c'est une erreur 401 de type "User must update password"
      if (res.status === 401 && errorData.message === "User must update password") {
        return {
          error: "password_update_required",
          phone: credentials.phone,
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

    return { token, permissions, phone: userPhone, id };
  } catch (e: any) {
    console.error("Erreur de connexion:", e);
    
    // Retourner l'erreur spécifique de l'API si disponible
    if (e.message && !e.message.includes("fetch failed")) {
      throw new Error(e.message);
    }
    
    throw new Error("Erreur de connexion. Vérifiez vos identifiants.");
  }
}

// TODO: Déconnecter l'utilisateur s'il est inactif depuis plus de 15 minutes

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret:
    process.env.NEXTAUTH_SECRET ||
    "DSHpAKMwKkLIfaZyQ8jYx/Yl4zl1WpRrG42rXWWs18Q=",
  pages: { signIn: "/login", signOut: "/login", error: "/login" },
  providers: [
    Credentials({
      name: "credentials",
      // You can specify which fields should be submitted, by adding keys to the `credentials` object.
      // e.g. domain, username, password, 2FA token, etc.
      credentials: {
        phone: {},
        password: {},
      },
      authorize: async (credentials) => {
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
            token: user.token,
          };
        } catch (e: any) {
          console.error("Erreur d'autorisation:", e);
          // Si c'est l'erreur de mise à jour de mot de passe, on la propage
          if (e.message === "password_update_required") {
            throw e;
          }
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Lorsqu'un utilisateur se connecte
      if (user) {
        token.accessToken = user.token;
        token.id = user.id;
        token.phone = user.phone;

        // Stocker le token dans sessionStorage pour les requêtes API
        if (typeof window !== "undefined" && user.token) {
          sessionStorage.setItem("auth_token", user.token);
        }
      }
      return token;
    },
    async session({ session, token }) {
      // Ajout du token à la session pour qu'il soit accessible côté client
      session.accessToken = token.accessToken as string;
      session.id = token.id as string;
      session.phone = token.phone as string;

      // Stocker le token dans sessionStorage pour les requêtes API
      if (typeof window !== "undefined" && token.accessToken) {
        sessionStorage.setItem("auth_token", token.accessToken as string);
      }

      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
  debug: process.env.NODE_ENV === "development",
});
