"use client";

import { DatePicker } from "@/components/ui/date-picker";
import { Label } from "@/components/ui/label";
import { DataTableSkeleton } from "@/components/ui/table/data-table-skeleton";
import $axios from "@/lib/axios";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { columns } from "./columns";
import { DataTable } from "./data-table";

export const TransactionsStatement = () => {
  const { data: session } = useSession();
  const token = session?.accessToken;

  const today = new Date();
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(today.getMonth() - 4);

  const [startDate, setStartDate] = useState<string>(
    format(oneMonthAgo, "yyyy-MM-dd")
  );
  const [endDate, setEndDate] = useState<string>(format(today, "yyyy-MM-dd"));

  const [isFirstLoad, setIsFirstLoad] = useState(true);

  const { data, refetch, isLoading, isFetching, error } = useQuery({
    queryKey: ["transactions-statement", startDate, endDate, token],
    queryFn: async () => {
      if (!token) return [];

      try {
        const { data } = await $axios.get("/accounts/statement", {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true,
          params: {
            startDate,
            endDate,
          },
        });

        if (!Array.isArray(data)) {
          console.warn("Format inattendu:", data);
          return [];
        }

        return data;
      } catch (error) {
        console.error("Erreur de récupération:", error);
        toast.error("Impossible de charger les transactions");
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
      refetch();
    }
  }, [token, isFirstLoad, refetch]);

  // ✅ Afficher un skeleton si c'est le premier chargement
  if (isLoading || (isFirstLoad && isFetching)) {
    return (
      <div className="mt-6">
        <DataTableSkeleton columnCount={5} rowCount={10} filterCount={2} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-row gap-2 items-end">
        <div className="flex flex-col gap-2">
          <Label>Date de début</Label>
          <DatePicker
            date={startDate ? new Date(startDate) : oneMonthAgo}
            setDate={(date) => {
              if (date) {
                setStartDate(date.toISOString().split("T")[0]);
              }
            }}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Date de fin</Label>
          <DatePicker
            date={endDate ? new Date(endDate) : today}
            setDate={(date) => {
              if (date) {
                setEndDate(date.toISOString().split("T")[0]);
              }
            }}
          />
        </div>
      </div>

      {error ? (
        <div className="p-4 text-red-500 bg-red-50 rounded-md">
          Une erreur est survenue lors du chargement des transactions. Veuillez
          réessayer.
        </div>
      ) : (
        <DataTable columns={columns} data={Array.isArray(data) ? data : []} />
      )}
    </div>
  );
};
