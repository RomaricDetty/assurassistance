"use client";

import { usePathname } from "next/navigation";
import { useMemo } from "react";

type BreadcrumbItem = {
  title: string;
  link: string;
};

// This allows to add custom title as well
const routeMapping: Record<string, BreadcrumbItem[]> = {
  "/dashboard": [{ title: "Dashboard", link: "/dashboard" }],
  "/dashboard/utilisateur": [
    { title: "Dashboard", link: "/dashboard" },
    { title: "Utilisateur", link: "/dashboard/utilisateur" },
  ],
  "/dashboard/utilisateur/ordinaire": [
    { title: "Dashboard", link: "/dashboard" },
    { title: "Utilisateur", link: "/dashboard/utilisateur" },
    { title: "Ordinaire", link: "/dashboard/utilisateur/ordinaire" },
  ],
  "/dashboard/utilisateur/marchand": [
    { title: "Dashboard", link: "/dashboard" },
    { title: "Utilisateur", link: "/dashboard/utilisateur" },
    { title: "Marchand", link: "/dashboard/utilisateur/marchand" },
  ],
  "/dashboard/ecommerce": [
    { title: "Dashboard", link: "/dashboard" },
    { title: "Ecommerce", link: "/dashboard/ecommerce" },
  ],
  "/dashboard/ecommerce/categorie": [
    { title: "Dashboard", link: "/dashboard" },
    { title: "Ecommerce", link: "/dashboard/ecommerce" },
    { title: "Categorie", link: "/dashboard/ecommerce/categorie" },
  ],
  "/dashboard/ecommerce/marque": [
    { title: "Dashboard", link: "/dashboard" },
    { title: "Ecommerce", link: "/dashboard/ecommerce" },
    { title: "Marque", link: "/dashboard/ecommerce/marque" },
  ],
  "/dashboard/ecommerce/produits": [
    { title: "Dashboard", link: "/dashboard" },
    { title: "Ecommerce", link: "/dashboard/ecommerce" },
    { title: "Produits", link: "/dashboard/ecommerce/produits" },
  ],
  "/dashboard/ecommerce/commande": [
    { title: "Dashboard", link: "/dashboard" },
    { title: "Ecommerce", link: "/dashboard/ecommerce" },
    { title: "Commande", link: "/dashboard/ecommerce/commande" },
  ],
  "/dashboard/service": [
    { title: "Dashboard", link: "/dashboard" },
    { title: "Service", link: "/dashboard/service" },
  ],
  "/dashboard/service/airtime": [
    { title: "Dashboard", link: "/dashboard" },
    { title: "Service", link: "/dashboard/service" },
    { title: "Airtime", link: "/dashboard/service/airtime" },
  ],
  "/dashboard/reglage": [
    { title: "Dashboard", link: "/dashboard" },
    { title: "Reglage", link: "/dashboard/reglage" },
  ],
  "/dashboard/caissier": [
    { title: "Dashboard", link: "/dashboard" },
    { title: "Caissier", link: "/dashboard/caissier" },
  ],
  "/dashboard/caisse": [
    { title: "Dashboard", link: "/dashboard" },
    { title: "Caisse", link: "/dashboard/caisse" },
  ],
  "/dashboard/compte": [
    { title: "Dashboard", link: "/dashboard" },
    { title: "Compte", link: "/dashboard/compte" },
  ],
  "/dashboard/compte/details": [
    { title: "Dashboard", link: "/dashboard" },
    { title: "Compte", link: "/dashboard/compte" },
    { title: "Détails", link: "/dashboard/compte/details" },
  ],
  "/dashboard/compte/transactions": [
    { title: "Dashboard", link: "/dashboard" },
    { title: "Compte", link: "/dashboard/compte" },
    { title: "Transactions", link: "/dashboard/compte/transactions" },
  ],
  "/dashboard/compte/transferts": [
    { title: "Dashboard", link: "/dashboard" },
    { title: "Compte", link: "/dashboard/compte" },
    { title: "Transferts", link: "/dashboard/compte/transferts" },
  ],
};

export function useBreadcrumbs() {
  const pathname = usePathname();

  const breadcrumbs = useMemo(() => {
    // Check if we have a custom mapping for this exact path
    if (routeMapping[pathname]) {
      return routeMapping[pathname];
    }

    // If no exact match, fall back to generating breadcrumbs from the path
    const segments = pathname.split("/").filter(Boolean);
    return segments.map((segment, index) => {
      const path = `/${segments.slice(0, index + 1).join("/")}`;
      return {
        title: segment.charAt(0).toUpperCase() + segment.slice(1),
        link: path,
      };
    });
  }, [pathname]);

  return breadcrumbs;
}
