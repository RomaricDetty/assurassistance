"use client";

import { CardTitle } from "@/components/ui/card";
import $axios from "@/lib/axios";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { columns } from "./columns";
import { DataTable } from "./data-table";

export const CaissesList = () => {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const id = session?.id;

  const [isFirstLoad, setIsFirstLoad] = useState(true);

  const { data, refetch, error } = useQuery({
    queryKey: ["cash-desk-statement"],
    queryFn: async () => {
      if (!token) {
        return [];
      }

      try {
        const { data } = await $axios.get("/users/" + id, {
          headers: {
            Accept: "application/json",
            Authorization: token ? `Bearer ${token}` : "",
          },
          withCredentials: true,
          params: {},
        });

        if (!data || !Array.isArray(data?.cashDeskDtos)) {
          console.warn(
            "L'API a retourné un format de données inattendu:",
            data
          );
          return [];
        }

        return data;
      } catch (error) {
        console.error("Erreur lors de la récupération des données:", error);
        toast.error("Impossible de charger les données");
        return [];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    retry: 2,
    enabled: !!token && !isFirstLoad, // Désactiver la requête au premier chargement
  });

  // Effectuer la première requête une fois que le token est disponible
  useEffect(() => {
    if (token && isFirstLoad) {
      setIsFirstLoad(false);
      refetch().then((r) => console.log(r));
    }
  }, [token, isFirstLoad, refetch]);

  return (
    <div className="flex flex-col gap-4 mt-5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <CardTitle>Liste des caisses</CardTitle>
      </div>

      {error ? (
        <div className="p-4 text-red-500 bg-red-50 rounded-md">
          Une erreur est survenue lors du chargement des données. Veuillez
          réessayer.
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={Array.isArray(data?.cashDeskDtos) ? data?.cashDeskDtos : []}
        />
      )}
    </div>
  );
};
