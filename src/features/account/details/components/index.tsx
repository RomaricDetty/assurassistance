"use client";

import { CardTitle } from "@/components/ui/card";
import { DataTableSkeleton } from "@/components/ui/table/data-table-skeleton";
import $axios from "@/lib/axios";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { columnsLast10Transactions } from "./columnsLast10Transactions";
import { DataTable } from "./data-table";

export const LastTransactions = () => {
    const {data: session} = useSession();

    const token = session?.accessToken;

    const [isFirstLoad, setIsFirstLoad] = useState(true);

    const {
        data,
        refetch,
        isLoading,
        error,
        isFetching,
    } = useQuery({
        queryKey: ["last-transactions", token],
        queryFn: async () => {
            if (!token) return [];

            try {
                const {data} = await $axios.get("/accounts/details", {
                    headers: {
                        Accept: "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    withCredentials: true,
                });

                if (!data || !Array.isArray(data?.operations)) {
                    console.warn("API a retourné un format inattendu:", data);
                    return [];
                }

                return data;
            } catch (error) {
                console.error("Erreur de chargement des transactions:", error);
                toast.error("Impossible de charger les transactions");
                return [];
            }
        },
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
        retry: 2,
        enabled: !!token && !isFirstLoad,
    });

    // Lancer la première requête manuellement une fois le token dispo
    useEffect(() => {
        if (token && isFirstLoad) {
            setIsFirstLoad(false);
            refetch().then(r => console.log("Initial fetch done:", r));
        }
    }, [token, isFirstLoad, refetch]);

    // ✅ Gestion du skeleton pendant le premier chargement
    if (isLoading || (isFirstLoad && isFetching)) {
        return (
            <DataTableSkeleton
                columnCount={5}
                rowCount={8}
                filterCount={2}
            />
        );
    }

    return (
        <div className="flex flex-col gap-4 mt-5">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <CardTitle>
                    Les {data?.operations?.length || 10} dernières transactions
                </CardTitle>
            </div>

            {error ? (
                <div className="p-4 text-red-500 bg-red-50 rounded-md">
                    Une erreur est survenue lors du chargement des transactions. Veuillez
                    réessayer.
                </div>
            ) : (
                <DataTable
                    columns={columnsLast10Transactions}
                    data={Array.isArray(data?.operations) ? data.operations : []}
                />
            )}
        </div>
    );
};
