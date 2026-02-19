"use client";

import PageContainer from "@/components/layout/page-container";
import { Heading } from "@/components/ui/heading";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { DataTableSkeleton } from "@/components/ui/table/data-table-skeleton";
import { CaissiersList } from "@/features/caissiers/components";
import { AddCashierModal } from "@/features/caissiers/components/add-cashier-modal";
import $axios from "@/lib/axios";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";

export default function CaissierPage() {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const id = session?.id;

  // Utiliser useQuery au lieu de prefetchQuery pour un composant client
  const { isLoading } = useQuery({
    queryKey: ["cashier-desk-statement"],
    queryFn: async () => {
      if (!id) return [];

      const { data } = await $axios.get("/users/" + id, {
        headers: {
          Accept: "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        withCredentials: true,
        params: {},
      });

      if (!data || !Array.isArray(data?.cashiers)) {
        console.warn("L'API a retourné un format de données inattendu:", data);
        return [];
      }

      return data;
    },
    enabled: !!id, // N'exécute la requête que si l'ID est disponible
  });

  return (
    <PageContainer>
      <div className="flex flex-1 flex-col space-y-4 h-full">
        <div className="flex items-start justify-between">
          <Heading title="Caissiers" description="Gérer vos caissiers." />
        </div>
        <Separator />

        <ScrollArea className="h-[calc(100vh-180px)]">
          <div className={"mt-5 items-center justify-end flex"}>
            <AddCashierModal />
          </div>

          {isLoading ? (
            <DataTableSkeleton columnCount={5} rowCount={8} filterCount={2} />
          ) : (
            <CaissiersList />
          )}
        </ScrollArea>
      </div>
    </PageContainer>
  );
}
