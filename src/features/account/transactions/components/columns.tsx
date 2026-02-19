/* eslint-disable @typescript-eslint/no-explicit-any */

"use client";

import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import type { TransactionColumnSchema } from "@/features/account/transactions/utils/types";
import $axios from "@/lib/axios";
import type { ColumnDef } from "@tanstack/react-table";
import { format, isSameDay } from "date-fns";
import { fr } from "date-fns/locale";
import { MoreHorizontal } from "lucide-react";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { renderTransactionType } from "../utils/format";

function formatDate(dateString: string) {
  console.log("dateString =>, ", dateString);
  const date = new Date(dateString);
  console.log("New date =>, ", date);
  return format(date, "dd MMMM yyyy à HH:mm", { locale: fr });
}

interface TransactionDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactionId: string;
  transaction: TransactionColumnSchema;
}

// Composant de modal pour les détails de transaction
const TransactionDetailsModal = ({
  isOpen,
  onClose,
  transactionId,
  transaction,
}: TransactionDetailsModalProps) => {
  const [transactionData, setTransactionData] = useState<TransactionColumnSchema & {cashier: any, receiver: any}>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { data: session } = useSession();

  // Récupérer le token d'authentification
  const token = session?.accessToken;

  // Charger les détails de la transaction quand le modal s'ouvre
  useEffect(() => {
    if (isOpen && transaction?.id) {
      setIsLoading(true);
      setError("");

      const fetchTransactionDetails = async () => {
        try {
          const { data } = await $axios.get(
            `/cashdesks/operation/${transaction?.id}/details`,
            {
              headers: {
                Accept: "application/json",
                Authorization: `Bearer ${token}`,
              },
              withCredentials: true,
            }
          );
          console.log("Data details transactions =>, ", data);
          setTransactionData({ ...data });
        } catch (err) {
          if ((err as any)?.response?.status === 404) {
            console.log("<== 404 ==>");
            setError("Les détails n'existent pas pour cette transaction !");
            toast.error("Les détails n'existent pas pour cette transaction !");

            return false;
          }

          console.error("Erreur lors de la récupération des détails:", err);
          setError("Impossible de récupérer les détails de la transaction !");
          toast.error(
            "Impossible de récupérer les détails de la transaction !"
          );
        } finally {
          setIsLoading(false);
        }
      };

      fetchTransactionDetails().then((r) => console.log(r));
    }
  }, [isOpen, transactionId, token, transaction?.id]);

  // Affichage pendant le chargement
  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent
          className="sm:max-w-lg md:max-w-2xl"
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Détails de la transaction</DialogTitle>
            <DialogDescription>Chargement des données...</DialogDescription>
          </DialogHeader>
          <div className="flex justify-center items-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={onClose}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Affichage en cas d'erreur
  if (error) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent
          className="sm:max-w-lg md:max-w-2xl"
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Erreur</DialogTitle>
            <DialogDescription
              className={"flex items-center justify-center my-10 text-lg"}
            >
              {error}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={onClose}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Affichage quand les données sont chargées
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="sm:max-w-lg md:max-w-2xl"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Détails de la transaction</DialogTitle>
          {transactionData && (
            <DialogDescription>
              Référence : <strong>{transactionData?.reference}</strong>
            </DialogDescription>
          )}
        </DialogHeader>

        {transactionData && (
          <div className="grid gap-4 py-4">
            {transaction?.type && (
              <div className="grid grid-cols-2 items-center gap-4">
                <div className="font-medium">Opération : </div>
                <div>{renderTransactionType(transaction?.type)}</div>
              </div>
            )}
            {transactionData?.cashier && (
              <div className="grid grid-cols-2 items-center gap-4">
                <div className="font-medium">Caissier : </div>
                <div>{transactionData?.cashier?.fullName}</div>
              </div>
            )}
            {transactionData?.receiver && (
              <div className="grid grid-cols-2 items-center gap-4">
                <div className="font-medium">Bénéficiaire : </div>
                <div>
                  {transactionData?.receiver?.fullname || "Non spécifié "} (
                  {transactionData?.receiver?.phone})
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 items-center gap-4">
              <div className="font-medium">Montant : </div>
              <div>
                {new Intl.NumberFormat("fr-FR", {
                  style: "currency",
                  currency: "XOF",
                }).format(transactionData?.amount)}
              </div>
            </div>
            <div className="grid grid-cols-2 items-center gap-4">
              <div className="font-medium">Date d&apos;opération : </div>
              <div>{formatDate(transactionData?.operationDate)}</div>
            </div>
            {transactionData?.tag && (
              <div className="grid grid-cols-2 items-center gap-4">
                <div className="font-medium">Tag : </div>
                <div>{transactionData?.tag}</div>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="secondary" onClick={onClose}>
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export const columns: ColumnDef<TransactionColumnSchema>[] = [
  {
    accessorKey: "type",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Type" />
    ),
    enableHiding: false,
    cell: ({ row }) => {
      const type = row.getValue("type") as string;
      let variant: "default" | "secondary" | "destructive" | "outline" =
        "default";

      switch (type) {
        case "TRANSFER_IN":
          variant = "secondary";
          break;
        case "TRANSFER_OUT":
          variant = "destructive";
          break;
        case "DEPOSIT":
          variant = "default";
          break;
        case "WITHDRAWAL":
          variant = "outline";
          break;
        case "CASHDESK_ALLOCATION":
          variant = "secondary";
          break;
        case "REVERSE_CASHDESK_ALLOCATION":
          variant = "destructive";
          break;
        case "PAID":
          variant = "outline";
          break;
      }

      return (
        <Badge variant={variant} className="max-w-[200px]">
          {renderTransactionType(type)}
        </Badge>
      );
    },
  },
  {
    accessorKey: "reference",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Référence" />
    ),
    cell: ({ row }) => {
      const value = row.getValue("reference");
      return <div className="">{`${value}`}</div>;
      //     max-w-[200px] truncate
    },
  },
  {
    accessorKey: "amount",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Montant" />
    ),
    cell: ({ row }) => {
      const value = row.getValue("amount");
      return (
        <div className="text-muted-foreground">
          {new Intl.NumberFormat("fr-FR", {
            style: "currency",
            currency: "XOF",
          }).format(value as number)}
        </div>
      );
    },
    filterFn: (row, id, value) => {
      const array = row.getValue(id) as string[];
      if (typeof value === "string") return array.includes(value);
      // up to the user to define either `.some` or `.every`
      if (Array.isArray(value)) return value.some((i) => array.includes(i));
      return false;
    },
  },
  {
    accessorKey: "balance",
    header: "Solde",
    cell: ({ row }) => {
      const value = row.getValue("balance");
      return (
        <div className="text-muted-foreground">
          {new Intl.NumberFormat("fr-FR", {
            style: "currency",
            currency: "XOF",
          }).format(value as number)}
        </div>
      );
    },
  },
  {
    accessorKey: "operationDate",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Date" />
    ),
    cell: ({ row }) => {
      const value = row.getValue("operationDate");
      return (
        <div className="text-xs text-muted-foreground" suppressHydrationWarning>
          {formatDate(value as string)}
        </div>
      );
    },
    filterFn: (row, id, value) => {
      const rowValue = row.getValue(id);
      if (value instanceof Date && rowValue instanceof Date) {
        return isSameDay(value, rowValue);
      }
      return false;
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const transaction = row.original;
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const [isModalOpen, setIsModalOpen] = useState(false);

      return (
        <>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  setIsModalOpen(true);
                }}
              >
                Voir les détails
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Modal pour afficher les détails */}
          <TransactionDetailsModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            transactionId={transaction.id.toString()}
            transaction={transaction}
          />
        </>
      );
    },
  },
];
