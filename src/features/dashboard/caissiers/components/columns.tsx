"use client";

import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import type { TransactionColumnSchema } from "@/features/account/transactions/utils/types";
import type { ColumnDef } from "@tanstack/react-table";

export const columns: ColumnDef<TransactionColumnSchema>[] = [

    {
        accessorKey: "firstName",
        header: ({column}) => (
            <DataTableColumnHeader column={column} title="Nom"/>
        ),
        cell: ({row}) => {
            const value = row.getValue("firstName");
            return <div className="">{`${value}`}</div>;
        },
    },
    {
        accessorKey: "lastName",
        header: ({column}) => (
            <DataTableColumnHeader column={column} title="Prénom(s)"/>
        ),
        cell: ({row}) => {
            const value = row.getValue("lastName");
            return <div className="">{`${value}`}</div>;
        },
    },
    {
        accessorKey: "phone",
        header: ({column}) => (
            <DataTableColumnHeader column={column} title="Numéro de téléphone"/>
        ),
        cell: ({row}) => {
            const value = row.getValue("phone");
            return <div className="">{`${value}`}</div>;
        },
    },
];
