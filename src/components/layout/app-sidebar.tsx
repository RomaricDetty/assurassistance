"use client";

import {
  Command,
  CreditCard,
  HandCoins,
  Home,
  UserCheck
} from "lucide-react";
import * as React from "react";
import { useEffect, useState } from "react";

import { NavMain } from "@/components/layout/nav-main";
// import {NavProjects} from "@/components/layout/nav-projects";
import { NavUser } from "@/components/layout/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import $axios from "@/lib/axios";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react"; // Importez useSession si vous utilisez next-auth

const data = {
  user: {
    businessName: "",
    phone: "",
    email: "marchand",
    avatar: "/avatars/shadcn.jpg",
    accountNumber: "",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: Home,
      isActive: true,
    },
    {
      title: "Compte",
      url: "",
      icon: CreditCard,
      items: [
        {
          title: "Détails",
          url: "/dashboard/compte/details",
        },
        {
          title: "Transactions",
          url: "/dashboard/compte/transactions",
        },
        {
          title: "Transferts",
          url: "/dashboard/compte/transferts",
        },
      ],
    },
    {
      title: "Caisse",
      url: "/dashboard/caisse",
      icon: HandCoins,
      items: [
        // {
        //     title: "Création",
        //     url: "/dashboard/caisse/creation",
        // },
        // {
        //     title: "Liste",
        //     url: "/dashboard/caisse/liste",
        // },
        // {
        //     title: "Ouverture",
        //     url: "/dashboard/caisse/ouverture",
        // },
        // {
        //     title: "Fermeture",
        //     url: "/dashboard/caisse/fermeture",
        // },
        // {
        //     title: "Approvisionnement",
        //     url: "/dashboard/caisse/approvisionnement",
        // },
      ],
    },
    {
      title: "Caissier",
      url: "/dashboard/caissier",
      icon: UserCheck,
      items: [
        // {
        //     title: "Création",
        //     url: "/dashboard/caissier/creation",
        // },
        // {
        //     title: "Liste",
        //     url: "/dashboard/caissier/liste",
        // },
        // {
        //     title: "Assigner à une caisse",
        //     url: "/dashboard/caisse/assigner",
        // },
      ],
    },
  ],
  projects: [
    // {
    //     name: "Caisse",
    //     url: "/dashboard/caisse",
    //     icon: HandCoins,
    //     items: [
    //         {
    //             title: "Détails",
    //             url: "/dashboard/compte/details",
    //         },
    //         {
    //             title: "Transactions",
    //             url: "/dashboard/compte/transactions",
    //         },
    //         {
    //             title: "Transferts",
    //             url: "/dashboard/compte/transferts",
    //         },
    //     ]
    // },
    // {
    //     name: "Caissier",
    //     url: "/dashboard/caissier",
    //     icon: Wallet,
    //     items: [
    //         {
    //             title: "Détails",
    //             url: "/dashboard/compte/details",
    //         },
    //         {
    //             title: "Transactions",
    //             url: "/dashboard/compte/transactions",
    //         },
    //         {
    //             title: "Transferts",
    //             url: "/dashboard/compte/transferts",
    //         },
    //     ]
    // },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  // État local pour stocker les informations du marchand
  const [merchantInfo, setMerchantInfo] = useState(data.user);

  // Récupérer la session et le token
  const { data: session } = useSession();
  const token = session?.accessToken;
  const id = session?.id;
  const phone = session?.phone;

  // Utiliser useQuery pour récupérer les informations du marchand
  const { data: merchantData } = useQuery({
    queryKey: ["merchant-info"],
    queryFn: async () => {
      // Vérifier que le token est disponible
      if (!token) return null;

      const { data } = await $axios.get("/users/" + id, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
        params: {},
      });

      return data;
    },
    // Ne pas exécuter la requête si le token n'est pas disponible
    enabled: !!token,
  });

  // Mettre à jour les données utilisateur lorsque les données du marchand sont chargées
  useEffect(() => {
    console.log("merchantData =>, ", merchantData);
    if (merchantData) {
      setMerchantInfo({
        ...data.user,
        accountNumber:
          merchantData?.accounts[0]?.accountNumber || "Account number",
        businessName: merchantData?.businessName,
        email: merchantData?.email,
        // Ajouter d'autres propriétés ici si nécessaire
      });
    }
  }, [merchantData]);

  return (
    <Sidebar variant="inset" {...props} side={"left"}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="#">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <Command className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{phone}</span>
                  <span className="truncate text-xs">Marchand</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        {/*<NavProjects projects={data.projects}/>*/}
      </SidebarContent>
      <SidebarFooter>
        {/* Utiliser les données mises à jour */}
        <NavUser user={merchantInfo} />
      </SidebarFooter>
    </Sidebar>
  );
}
