"use client";

import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Badge } from "@/components/ui/badge";
import type { TransactionColumnSchema } from "@/features/account/transactions/utils/types";
import type { ColumnDef } from "@tanstack/react-table";
import { renderCaisseActiveInactive, renderCaisseFermeeOuverte } from "../utils/format";

export const columns: ColumnDef<TransactionColumnSchema>[] = [

    {
        accessorKey: "name",
        header: ({column}) => (
            <DataTableColumnHeader column={column} title="Nom"/>
        ),
        cell: ({row}) => {
            const value = row.getValue("name");
            return <div className="">{`${value}`}</div>;
        },
    },
    {
        accessorKey: "allocatedBalance",
        header: ({column}) => (
            <DataTableColumnHeader column={column} title="Montant alloué"/>
        ),
        cell: ({row}) => {
            const value = row.getValue("allocatedBalance");
            return <div className="text-muted-foreground">
                {
                    new Intl.NumberFormat('fr-FR', {style: 'currency', currency: 'XOF'}).format(value as number)
                }
            </div>;
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
        accessorKey: "isActive",
        header: "Active / Inactive",
        // cell: ({row}) => {
        //     const value = row.getValue("isActive");
        //     return <div className="text-muted-foreground">{`${value}`}</div>;
        // },

        cell: ({row}) => {
            const isActive = row.getValue("isActive") ? "true" : "false";
            console.log("isActive =>, ", isActive)
            let variant: "success" | "destructive" ;

            switch (isActive) {
                case "true":
                    variant = "success";
                    break;
                case "false":
                    variant = "destructive";
                    break;
            }

            return (
                <Badge variant={variant} className="max-w-[200px]">
                    {renderCaisseActiveInactive(isActive)}
                </Badge>
            );
        },
    },
    {
        accessorKey: "isClose",
        header: "Fermée / Ouverte",
        // cell: ({row}) => {
        //     const value = row.getValue("isClose");
        //     return <div className="text-muted-foreground">{`${value}`}</div>;
        // },
        cell: ({row}) => {
            const isClose = row.getValue("isClose") ? "true" : "false";
            console.log("isClose =>, ", isClose)
            let variant: "success" | "destructive" ;

            switch (isClose) {
                case "true":
                    variant = "destructive";
                    break;
                case "false":
                    variant = "success";
                    break;
            }

            return (
                <Badge variant={variant} className="max-w-[200px]">
                    {renderCaisseFermeeOuverte(isClose)}
                </Badge>
            );
        },
    },
];
