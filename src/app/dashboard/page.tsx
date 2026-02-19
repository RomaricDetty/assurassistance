/* eslint-disable @typescript-eslint/no-explicit-any */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { auth } from "@/lib/auth";
import $axios from "@/lib/axios";
import {
    dehydrate,
    HydrationBoundary,
    QueryClient,
} from "@tanstack/react-query";
import {
    HandCoins,
    UserCheck,
    Wallet
} from "lucide-react";
// import {LastTransactions} from "@/features/account/details/components";
import PageContainer from "@/components/layout/page-container";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Caisses } from "@/features/dashboard/caisses/components";
import { Caissiers } from "@/features/dashboard/caissiers/components";

let userData: any = {};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XOF",
  }).format(amount);
}

/**
 * Fonction pour lister les caisses et les caissiers
 *
 * @param queryClient
 * @constructor
 */
function ListCashDeskAndCashier({ queryClient }: { queryClient: QueryClient }) {
  return (
    <ScrollArea className="h-[calc(100dvh-200px)]">
      <HydrationBoundary state={dehydrate(queryClient)}>
        <Caisses />
        <Caissiers />
      </HydrationBoundary>
    </ScrollArea>
  );
}

export default async function Page() {
  const session = await auth();
  const token = session?.accessToken;
  const id = session?.id;

  // Vérifier que la session existe avant de faire des appels API
  if (!session || !token || !id) {
    return (
      <PageContainer scrollable={true}>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600">Session non trouvée</h1>
            <p className="text-gray-600 mt-2">Veuillez vous reconnecter.</p>
          </div>
        </div>
      </PageContainer>
    );
  }

  const queryClient = new QueryClient();
  await queryClient.prefetchQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const { data } = await $axios.get("/users/" + id, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
        params: {},
      });

      userData = { ...data };
      console.log("Details user =>, ", data);
      return data;
    },
  });

  return (
    <PageContainer scrollable={true}>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <Card>
            <div className="flex items-start justify-between">
              <div className="w-full">
                <CardHeader className="flex flex-row items-center space-x-2">
                  <CardTitle className="text-lg font-medium text-green-600">
                    Solde du compte
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2 mt-3">
                    <p className="text-2xl font-bold text-green-600">
                      {userData?.accounts?.[0]?.balance 
                        ? formatCurrency(userData.accounts[0].balance)
                        : "0 XOF"}
                    </p>
                  </div>
                </CardContent>
              </div>
              <div className="px-5">
                <Wallet className="h-10 w-10 text-green-600" />
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-start justify-between">
              <div className="w-full">
                <CardHeader className="flex flex-row items-center space-x-2">
                  <CardTitle className="text-lg font-medium text-gray-500">
                    Total des caissiers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2 mt-3">
                    <p className="text-3xl font-bold text-gray-500">
                      {userData?.cashiers?.length || 0}
                    </p>
                  </div>
                </CardContent>
              </div>
              <div className="px-5">
                <UserCheck className="h-10 w-10 text-gray-500" />
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-start justify-between">
              <div className="w-full">
                <CardHeader className="flex flex-row items-center space-x-2">
                  <CardTitle className="text-lg font-medium text-gray-500">
                    Total des caisses
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2 mt-3">
                    <p className="text-3xl font-bold text-gray-500">
                      {userData?.cashDeskDtos?.length || 0}
                    </p>
                  </div>
                </CardContent>
              </div>
              <div className="px-5">
                <HandCoins className="h-10 w-10 text-gray-500" />
              </div>
            </div>
          </Card>
        </div>
        {/*<div className="bg-muted/50 min-h-[100vh] flex-1 rounded-xl md:min-h-min"/>*/}
        <Separator />
        <ListCashDeskAndCashier queryClient={queryClient} />
      </div>
    </PageContainer>
  );
}
