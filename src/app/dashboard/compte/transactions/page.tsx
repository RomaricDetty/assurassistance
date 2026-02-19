import PageContainer from "@/components/layout/page-container";
import { TransactionsStatement } from "@/features/account/transactions/components";
import { auth } from "@/lib/auth";
import $axios from "@/lib/axios";
import {
    dehydrate,
    HydrationBoundary,
    QueryClient,
} from "@tanstack/react-query";

import { Heading } from "@/components/ui/heading";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

export default async function CompteTransactionsPage() {
    const session = await auth();
    const token = session?.accessToken;

    // Calcul des dates dynamiques
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 1);

    // Formatage des dates au format YYYY-MM-DD
    const formatDate = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const formattedStartDate = formatDate(startDate);
    const formattedEndDate = formatDate(endDate);

    const queryClient = new QueryClient();
    await queryClient.prefetchQuery({
        queryKey: ["transactions-statement"],
        queryFn: async () => {
            const {data} = await $axios.get("/accounts/statement", {
                headers: {
                    Accept: "application/json",
                    Authorization: `Bearer ${token}`,
                },
                withCredentials: true,
                params: {
                    startDate: formattedStartDate,
                    endDate: formattedEndDate,
                },
            });
            return data;
        },
    });

    return (
        <PageContainer scrollable={true}>
            <div className="flex flex-1 flex-col space-y-4 h-full">
                <div className="flex items-start justify-between">
                    <Heading title="Transactions" description="Visualisez les transactions effectuées."/>
                    {/* <UserDialogTrigger mode="add"/>  */}
                </div>
                <Separator/>
                <ScrollArea className="h-[calc(100vh-180px)]">
                    <HydrationBoundary state={dehydrate(queryClient)}>
                        <TransactionsStatement/>
                    </HydrationBoundary>
                </ScrollArea>
            </div>
        </PageContainer>
    );
}
