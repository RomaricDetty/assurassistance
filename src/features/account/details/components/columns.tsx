"use client";

import {DataTableColumnHeader} from "@/components/data-table/data-table-column-header";
import type {TransactionColumnSchema} from "@/features/account/transactions/utils/types";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import type {ColumnDef} from "@tanstack/react-table";
import {format, isSameDay} from "date-fns";
import {MoreHorizontal} from "lucide-react";
import {Button} from "@/components/ui/button";
import {toast} from "sonner";
import {Badge} from "@/components/ui/badge";
import {renderTransactionType} from "../utils/format";

export const columns: ColumnDef<TransactionColumnSchema>[] = [
    {
        accessorKey: "type",
        header: ({column}) => (
            <DataTableColumnHeader column={column} title="Type"/>
        ),
        enableHiding: false,
        cell: ({row}) => {
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
        header: ({column}) => (
            <DataTableColumnHeader column={column} title="Référence"/>
        ),
        cell: ({row}) => {
            const value = row.getValue("reference");
            return <div className="max-w-[200px] truncate">{`${value}`}</div>;
        },
    },
    {
        accessorKey: "amount",
        header: ({column}) => (
            <DataTableColumnHeader column={column} title="Montant"/>
        ),
        cell: ({row}) => {
            const value = row.getValue("amount");
            return <div className="text-muted-foreground">{`${value}`}</div>;
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
        cell: ({row}) => {
            const value = row.getValue("balance");
            return <div className="text-muted-foreground">{`${value}`}</div>;
        },
    },
    {
        accessorKey: "operationDate",
        header: ({column}) => (
            <DataTableColumnHeader column={column} title="Date"/>
        ),
        cell: ({row}) => {
            const value = row.getValue("operationDate");
            return (
                <div className="text-xs text-muted-foreground" suppressHydrationWarning>
                    {format(new Date(`${value}`), "LLL dd, y HH:mm")}
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
        cell: ({row}) => {
            const user = row.original;

            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4"/>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem
                            onClick={() => {
                                navigator.clipboard.writeText(user.id.toString());
                                toast.success(
                                    "ID de l'utilisateur copié dans le presse-papiers"
                                );
                            }}
                        >
                            Copier l&apos;ID de l&apos;utilisateur
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            );
        },
    },
];
