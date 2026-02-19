import PageContainer from "@/components/layout/page-container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { LastTransactions } from "@/features/account/details/components";
import { auth } from "@/lib/auth";
import $axios from "@/lib/axios";
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Clock, CreditCard, Wallet } from "lucide-react";

type AccountData = {
  accountNumber: string;
  balance: number;
  lastTransactionAt: string;
};

let accountData: AccountData = {
  accountNumber: "",
  balance: 0,
  lastTransactionAt: "",
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XOF",
  }).format(amount);
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return format(date, "dd MMMM yyyy à HH:mm", { locale: fr });
}

function AccountSummary({ accountData }: { accountData: AccountData }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
      <Card>
        <div className="flex items-start justify-between">
          <div>
            <CardHeader className="flex flex-row items-center space-x-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                Numéro de compte
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2 mt-3">
                <p className="text-2xl font-bold">
                  {accountData?.accountNumber}
                </p>
              </div>
            </CardContent>
          </div>
          <div className="px-5">
            <CreditCard className="h-10 w-10 text-gray-500" />
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex items-start justify-between">
          <div>
            <CardHeader className="flex flex-row items-center space-x-2">
              <CardTitle className="text-sm font-medium text-green-600">
                Solde actuel
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2 mt-3">
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(accountData?.balance)}
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
          <div>
            <CardHeader className="flex flex-row items-center space-x-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                Dernière transaction
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2 mt-3">
                <p className="text-xl font-bold">
                  {formatDate(accountData?.lastTransactionAt)}
                </p>
              </div>
            </CardContent>
          </div>
          <div className="px-5">
            <Clock className="h-10 w-10 text-gray-500" />
          </div>
        </div>
      </Card>
    </div>
  );
}

export default async function CompteDetailsPage() {
  const session = await auth();
  const token = session?.accessToken;

  const queryClient = new QueryClient();
  await queryClient.prefetchQuery({
    queryKey: ["last-transactions"],
    queryFn: async () => {
      const { data } = await $axios.get("/accounts/details", {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
        params: {},
      });

      accountData = { ...data };
      return data;
    },
  });

  return (
    <PageContainer scrollable={false}>
      <div className="flex flex-1 flex-col space-y-4 h-full">
        <div className="flex items-start justify-between">
          <Heading
            title="Détails du compte"
            description="Visualisez les dernières opérations et le solde de votre compte."
          />
        </div>
        <Separator />
        <ScrollArea className="h-[calc(100vh-180px)]">
          <div className="pr-4">
            <AccountSummary accountData={accountData} />
          </div>
          <HydrationBoundary state={dehydrate(queryClient)}>
            <LastTransactions />
          </HydrationBoundary>
        </ScrollArea>
      </div>
    </PageContainer>
  );
}
