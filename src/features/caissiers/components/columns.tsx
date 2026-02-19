/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { TransactionColumnSchema } from "@/features/account/transactions/utils/types";
import $axios from "@/lib/axios";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";



/**
 * Modal pour l'assignation d'un caissier à une caisse
 *
 * @param isModalAssignerOpen - État d'ouverture du modal
 * @param onClose - Fonction pour fermer le modal
 * @param caissierInfo - Informations du caissier à assigner
 * @constructor
 */
const AssignerModal = ({ isModalAssignerOpen, onClose, caissierInfo }: { isModalAssignerOpen: boolean, onClose: () => void, caissierInfo: any }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const { data: session } = useSession();
    const [assignationData, setAssignationData] = useState({
        cashDeskId: "",
        startAt: "",
        endAt: ""
    });
    const queryClient = useQueryClient();

    // Récupérer le token d'authentification
    const token = session?.accessToken;
    const id = session?.id;


    /**
     * Récupérer la liste des caisses disponibles
     */
    const { data: cashDesksData, isLoading: isLoadingCashDesks } = useQuery({
        queryKey: ["cash-desk-statement"],
        queryFn: async () => {
            if (!id) return [];

            const { data } = await $axios.get("/users/" + id, {
                headers: {
                    Accept: "application/json",
                    Authorization: token ? `Bearer ${token}` : '',
                },
                withCredentials: true,
                params: {},
            });

            if (!data || !Array.isArray(data?.cashDeskDtos)) {
                console.warn("L'API a retourné un format de données inattendu:", data);
                return [];
            }

            return data;
        },
        enabled: !!id && isModalAssignerOpen, // N'exécute la requête que si l'ID est disponible et le modal est ouvert
    });



    /**
     * Générer des valeurs par défaut pour les horaires
     */
    useEffect(() => {
        // Par défaut, on définit la période d'assignation du jour actuel (10h à 20h)
        const now = new Date();
        const startDate = new Date(now);
        startDate.setHours(10, 0, 0, 0);

        const endDate = new Date(now);
        endDate.setHours(20, 0, 0, 0);

        setAssignationData(prev => ({
            ...prev,
            startAt: startDate.toISOString().slice(0, 16),
            endAt: endDate.toISOString().slice(0, 16)
        }));
    }, [isModalAssignerOpen]);

    /**
     * Gérer la soumission du formulaire d'assignation
     *
     * @param e
     */
    const handleAssignationSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        if (!assignationData.cashDeskId) {
            setError("Veuillez sélectionner une caisse");
            setIsLoading(false);
            return;
        }

        try {
            const { data } = await $axios.post("/cashiers",
                {
                    "cashierUserId": caissierInfo.id,
                    "cashDeskId": parseInt(assignationData.cashDeskId),
                    "startAt": new Date(assignationData.startAt).toISOString(),
                    "endAt": new Date(assignationData.endAt).toISOString()
                },
                {
                    headers: {
                        Accept: "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    withCredentials: true,
                }
            );

            console.log("Assignation du caissier effectuée => ,", data);

            // Invalider et rafraîchir le cache pour mettre à jour le tableau
            await queryClient.invalidateQueries({ queryKey: ["cashier-desk-statement"] });
            await queryClient.refetchQueries({ queryKey: ["cashier-desk-statement"] });

            onClose();
            toast.success(`Le caissier a été assigné avec succès à la caisse!`);

        } catch (err) {
            console.error("Erreur lors de l'assignation du caissier :", err);
            setError((err as any)?.response?.data?.message || "Impossible d'assigner le caissier à la caisse");
            toast.error("Impossible d'assigner le caissier : " + ((err as any)?.response?.data?.message || (err as any)?.message));
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Gérer les changements dans la sélection de la caisse
     *
     * @param e
     */
    const handleCashDeskChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setAssignationData({
            ...assignationData,
            cashDeskId: e.target.value
        });
    };

    /**
     * Gérer les changements dans la date de début
     *
     * @param e
     */
    const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setAssignationData({
            ...assignationData,
            startAt: e.target.value
        });
    };

    /**
     * Gérer les changements dans la date de fin
     *
     * @param e
     */
    const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setAssignationData({
            ...assignationData,
            endAt: e.target.value
        });
    };

    // Déterminer si le formulaire est valide
    const isFormValid =
        assignationData.cashDeskId &&
        assignationData.startAt &&
        assignationData.endAt &&
        new Date(assignationData.startAt) < new Date(assignationData.endAt);

    return (
        <Dialog open={isModalAssignerOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-lg md:max-w-2xl" onPointerDownOutside={(e) => e.preventDefault()}>
                <DialogHeader>
                    <DialogTitle>Assignation du caissier à une caisse</DialogTitle>
                    <DialogDescription>
                        Sélectionnez la caisse à laquelle vous souhaitez assigner {caissierInfo?.firstName} {caissierInfo?.lastName}.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleAssignationSubmit}>
                    <div className="grid gap-4 py-4">
                        {/* Sélection de la caisse */}
                        <div className="grid grid-cols-1 items-center gap-4">
                            <Label htmlFor="cashDesk" className="text-right">
                                Caisse
                            </Label>
                            <select
                                id="cashDesk"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={assignationData.cashDeskId}
                                onChange={handleCashDeskChange}
                                required
                                disabled={isLoading || isLoadingCashDesks}
                            >
                                <option value="">Sélectionnez une caisse</option>
                                {cashDesksData?.cashDeskDtos?.map((cashDesk: any) => (
                                    <option key={cashDesk.id} value={cashDesk.id}>
                                        {cashDesk.label || `Caisse ${cashDesk.id}`}
                                    </option>
                                ))}
                            </select>
                            {isLoadingCashDesks && <p className="text-sm text-muted-foreground">Chargement des caisses...</p>}
                        </div>

                        {/* Période d'assignation */}
                        <div className="grid grid-cols-1 items-center gap-4 mt-5">
                            <Label className="text-right">
                                Période d&apos;assignation
                            </Label>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="startAt" className="text-sm text-muted-foreground mb-3">
                                        Début
                                    </Label>
                                    <Input
                                        id="startAt"
                                        type="datetime-local"
                                        value={assignationData.startAt}
                                        onChange={handleStartDateChange}
                                        required
                                        disabled={isLoading}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="endAt" className="text-sm text-muted-foreground mb-3">
                                        Fin
                                    </Label>
                                    <Input
                                        id="endAt"
                                        type="datetime-local"
                                        value={assignationData.endAt}
                                        onChange={handleEndDateChange}
                                        required
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>
                        </div>

                        {!isFormValid && assignationData.startAt && assignationData.endAt &&
                            new Date(assignationData.startAt) >= new Date(assignationData.endAt) && (
                                <p className="text-sm text-destructive">La date de fin doit être postérieure à la date de début.</p>
                            )}

                        {error && <p className="text-sm text-destructive">{error}</p>}
                    </div>

                    <DialogFooter className="mt-10">
                        <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
                            Annuler
                        </Button>
                        <Button type="submit" disabled={isLoading || !isFormValid}>
                            {isLoading ? "Assignation en cours..." : "Assigner"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}



/**
 * Modal pour la modification des informations d'un caissier
 *
 * @param isModalModifOpen - État d'ouverture du modal
 * @param onClose - Fonction pour fermer le modal
 * @param caisseInfo - Informations du caissier à modifier
 * @constructor
 */
const ModifModal = ({isModalModifOpen, onClose, caissierInfo}: {isModalModifOpen: boolean, onClose: () => void, caissierInfo: any}) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const {data: session} = useSession();
    const [caissierData, setCaissierData] = useState({
        lastName: "",
        firstName: "",
        email: ""
    });
    const queryClient = useQueryClient();

    // Récupérer le token d'authentification
    const token = session?.accessToken;

    // Initialiser les données du formulaire avec les informations de la caisse
    useEffect(() => {
        console.log("caissierInfo =>, ", caissierInfo)
        if (caissierInfo) {
            setCaissierData({
                lastName: caissierInfo?.lastName,
                firstName: caissierInfo?.firstName,
                email: caissierInfo?.email
            });
        }
    }, [caissierInfo]);

    /**
     * Gérer la soumission du formulaire de modification
     *
     * @param e
     */
    const handleModificationSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");
        try {
            const {data} = await $axios.put(`/users/${caissierInfo.id}/ordinary`,
                {
                    "email": caissierData.email,
                    "firstName": caissierData.firstName,
                    "lastName": caissierData.lastName
                },
                {
                    headers: {
                        Accept: "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    withCredentials: true,
                });

            console.log("Modification du caissier effectuée =>", data);

            // Invalider et rafraîchir le cache pour mettre à jour le tableau
            await queryClient.invalidateQueries({ queryKey: ["cashier-desk-statement"] });
            await queryClient.refetchQueries({ queryKey: ["cashier-desk-statement"] });

            onClose();
            toast.success(`Les infos du caissier ont été modifiées avec succès!`);

        } catch (err) {
            console.error("Erreur lors de la modification des infos du caissier :", err);
            setError((err as any)?.response?.data?.message || "Impossible de modifier les infos du caissier");
            toast.error("Impossible de modifier les infos du caissier : " + ((err as any)?.response?.data?.message || (err as any)?.message));
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Gérer les changements dans le champ location
     *
     * @param e
     */
    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCaissierData({
            ...caissierData,
            email: e.target.value
        });
    };

    /**
     * Gérer les changements de firstName
     *
     * @param e
     */
    const handleFirstNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCaissierData({
            ...caissierData,
            firstName: e.target.value
        });
    };

    /**
     * Gérer les changements de lastName
     *
     * @param e
     */
    const handleLastNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCaissierData({
            ...caissierData,
            lastName: e.target.value
        });
    };

    return (
        <Dialog open={isModalModifOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-lg md:max-w-2xl" onPointerDownOutside={(e) => e.preventDefault()}>
                <DialogHeader>
                    <DialogTitle>Modification du caissier</DialogTitle>
                    <DialogDescription>
                        Modifiez les informations du caissier.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleModificationSubmit}>
                    <div className="grid gap-4 py-4">
                        {/* Champ pour l'adresse e-mail */}
                        <div className="grid grid-cols-1 items-center gap-4">
                            <Label htmlFor="email" className="text-right">
                                Adresse e-mail
                            </Label>
                            <Input
                                id="email"
                                className="col-span-3"
                                type="text"
                                placeholder="Adresse e-mail du caissier"
                                value={caissierData.email}
                                onChange={handleEmailChange}
                                required
                                disabled={isLoading}
                            />
                        </div>

                        {/* Champ pour le firstName*/}
                        <div className="grid grid-cols-1 items-center gap-4">
                            <Label htmlFor="firstName" className="text-right">
                                Nom
                            </Label>
                            <Input
                                id="firstName"
                                className="col-span-3"
                                type="text"
                                placeholder="Prénom(s) du caissier"
                                value={caissierData.firstName}
                                onChange={handleFirstNameChange}
                                required
                                disabled={isLoading}
                            />
                        </div>

                        {/* Champ pour le lastName */}
                        <div className="grid grid-cols-1 items-center gap-4">
                            <Label htmlFor="lastName" className="text-right">
                                Prénom(s)
                            </Label>
                            <Input
                                id="lastName"
                                className="col-span-3"
                                type="text"
                                placeholder="Nom du caissier"
                                value={caissierData.lastName}
                                onChange={handleLastNameChange}
                                required
                                disabled={isLoading}
                            />
                        </div>

                        {error && <p className="text-sm text-destructive">{error}</p>}
                    </div>

                    <DialogFooter className="mt-10">
                        <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
                            Annuler
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? "Mise à jour en cours..." : "Mettre à jour"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export const columns: ColumnDef<TransactionColumnSchema & {isClose: boolean}>[] = [

    {
        accessorKey: "firstName",
        header: ({column}) => (
            <DataTableColumnHeader column={column} title="Nom"/>
        ),
        cell: ({row}) => {
            const value = row.getValue("firstName");
            return <div className="">{`${value}`}</div>;
        },
    },{
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
    {
        id: "actions",
        header: "Actions",
        cell: ({row}) => {
            const caissier = row.original;
            // eslint-disable-next-line react-hooks/rules-of-hooks
            const [isModalModifOpen, setIsModalModifOpen] = useState(false);
            // eslint-disable-next-line react-hooks/rules-of-hooks
            const [isModalAssignerOpen, setIsModalAssignerOpen] = useState(false);

            return (
                <>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4"/>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem
                                onClick={() => {
                                    setIsModalModifOpen(true);
                                }}
                            >
                                Modifier les infos
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => {
                                    setIsModalAssignerOpen(true);
                                }}
                            >
                                Assigner à une caisse
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <ModifModal
                        isModalModifOpen={isModalModifOpen}
                        onClose={() => setIsModalModifOpen(false)}
                        caissierInfo={caissier}
                    />

                    <AssignerModal
                        isModalAssignerOpen={isModalAssignerOpen}
                        onClose={() => setIsModalAssignerOpen(false)}
                        caissierInfo={caissier}
                    />
                </>
            );
        },
    },
];
