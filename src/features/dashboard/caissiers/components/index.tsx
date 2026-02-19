"use client";

import { CardTitle } from "@/components/ui/card";
import { DataTableSkeleton } from "@/components/ui/table/data-table-skeleton";
import $axios from "@/lib/axios";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { columns } from "./columns";
import { DataTable } from "./data-table";

export const Caissiers = () => {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const id = session?.id;

  const [isFirstLoad, setIsFirstLoad] = useState(true);

  const { data, refetch, isLoading, error, isFetching } = useQuery({
    queryKey: ["list-cashiers", token],
    queryFn: async () => {
      if (!token) return [];

      try {
        const { data } = await $axios.get(`/users/${id}`, {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true,
        });

        if (!data || !Array.isArray(data?.cashiers)) {
          console.warn(
            "L'API a retourné un format de données inattendu:",
            data
          );
          return [];
        }

        return data;
      } catch (error) {
        console.error("Erreur lors de la récupération des données:", error);
        toast.error("Impossible de charger la liste des caissiers");
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 2,
    enabled: !!token && !isFirstLoad,
  });

  useEffect(() => {
    if (token && isFirstLoad) {
      setIsFirstLoad(false);
      refetch().then((r) => console.log("Initial fetch done:", r));
    }
  }, [token, isFirstLoad, refetch]);

  // ✅ Affichage du Skeleton pendant le chargement initial
  if (isLoading || (isFirstLoad && isFetching)) {
    return <DataTableSkeleton columnCount={5} rowCount={8} filterCount={1} />;
  }

  return (
    <div className="flex flex-col gap-4 mt-5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <CardTitle>La liste des caissiers</CardTitle>
      </div>

      {error ? (
        <div className="p-4 text-red-500 bg-red-50 rounded-md">
          Une erreur est survenue lors du chargement des données. Veuillez
          réessayer.
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={Array.isArray(data?.cashiers) ? data?.cashiers : []}
        />
      )}
    </div>
  );
};
