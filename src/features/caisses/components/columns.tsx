/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/rules-of-hooks */

"use client";

import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import {
  DropdownMenu,
  DropdownMenuContent,
  // DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { TransactionColumnSchema } from "@/features/account/transactions/utils/types";
import type { ColumnDef } from "@tanstack/react-table";
// import {format, isSameDay} from "date-fns";
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
import { MoreHorizontal } from "lucide-react";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  renderCaisseActiveInactive,
  renderCaisseFermeeOuverte,
} from "../utils/format";
// import {renderTransactionType} from "@/features/account/transactions/utils/format";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import $axios from "@/lib/axios";
import { useQueryClient } from "@tanstack/react-query";

interface CloseModalProps {
  isModalCloseOpen: boolean;
  onClose: () => void;
  caisseInfo: any;
}

interface ModifModalProps {
  isModalModifOpen: boolean;
  onClose: () => void;
  caisseInfo: any;
}

interface ApprovisionnerModalProps {
  isModalApprovisionnerOpen: boolean;
  onClose: () => void;
  caisseInfo: any;
}

/**
 * Modal pour l'ouverture/fermeture d'une caisse
 *
 * @param isModalCloseOpen - État d'ouverture du modal
 * @param onClose - Fonction pour fermer le modal
 * @param caisseInfo - Informations de la caisse à ouvrir/fermer
 * @constructor
 */
const CloseModal = ({
  isModalCloseOpen,
  onClose,
  caisseInfo,
}: CloseModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  // Récupérer le token d'authentification
  const token = session?.accessToken;

  /**
   * Gérer l'ouverture ou la fermeture de la caisse
   */
  const handleToggleCaisseStatus = async () => {
    setIsLoading(true);
    setError("");

    try {
      const endpoint = caisseInfo?.isClose
        ? `/cashdesks/${caisseInfo.id}/open`
        : `/cashdesks/${caisseInfo.id}/close`;

      const action = caisseInfo?.isClose ? "d'ouverture" : "de fermeture";

      const { data } = await $axios.put(
        endpoint,
        {}, // Corps vide car l'API n'attend pas de données
        {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true,
        }
      );

      console.log(`Action ${action} de la caisse effectuée =>`, data);

      // Invalider et rafraîchir le cache pour mettre à jour le tableau
      await queryClient.invalidateQueries({
        queryKey: ["cash-desk-statement"],
      });
      await queryClient.refetchQueries({ queryKey: ["cash-desk-statement"] });

      onClose();
      toast.success(
        `L'action ${action} de la caisse "${caisseInfo?.name}" a été effectuée avec succès!`
      );
    } catch (err) {
      console.error(
        "Erreur lors de la modification du statut de la caisse :",
        err
      );
      setError(
        (err as any)?.response?.data?.message ||
          "Impossible de modifier le statut de la caisse"
      );
      toast.error(
        "Impossible de modifier le statut de la caisse : " +
          ((err as any)?.response?.data?.message || (err as any)?.message)
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isModalCloseOpen} onOpenChange={onClose}>
      <DialogContent
        className="sm:max-w-lg md:max-w-2xl"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>
            {caisseInfo?.isClose ? "Ouverture" : "Fermeture"} de la caisse :{" "}
            <strong>{caisseInfo?.name}</strong>
          </DialogTitle>
          <DialogDescription>
            {caisseInfo?.isClose
              ? "Êtes-vous sûr de vouloir ouvrir cette caisse ?"
              : "Êtes-vous sûr de vouloir fermer cette caisse ?"}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm text-muted-foreground mb-4">
            {caisseInfo?.isClose
              ? "En ouvrant cette caisse, elle sera disponible pour les opérations financières."
              : "En fermant cette caisse, elle ne sera plus disponible pour les opérations financières."}
          </p>

          {error && <p className="text-sm text-destructive mt-2">{error}</p>}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isLoading}
          >
            Annuler
          </Button>
          <Button
            type="button"
            variant={caisseInfo?.isClose ? "destructive" : "default"}
            onClick={handleToggleCaisseStatus}
            disabled={isLoading}
          >
            {isLoading
              ? "Traitement en cours..."
              : caisseInfo?.isClose
              ? "Ouvrir la caisse"
              : "Fermer la caisse"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

/**
 * Modal pour la modification des informations d'une caisse
 *
 * @param isModalModifOpen - État d'ouverture du modal
 * @param onClose - Fonction pour fermer le modal
 * @param caisseInfo - Informations de la caisse à modifier
 * @constructor
 */
const ModifModal = ({
  isModalModifOpen,
  onClose,
  caisseInfo,
}: ModifModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { data: session } = useSession();
  const [caisseData, setCaisseData] = useState({
    location: "",
    isActive: false,
  });
  const queryClient = useQueryClient();

  // Récupérer le token d'authentification
  const token = session?.accessToken;

  // Initialiser les données du formulaire avec les informations de la caisse
  useEffect(() => {
    if (caisseInfo) {
      setCaisseData({
        location: caisseInfo.location || "",
        isActive: caisseInfo.isActive || false,
      });
    }
  }, [caisseInfo]);

  /**
   * Gérer la soumission du formulaire de modification
   */
  const handleModificationSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      const { data } = await $axios.put(
        `/cashdesks/${caisseInfo.id}`,
        {
          location: caisseData.location,
          isActive: caisseData.isActive,
          // updatedAt: new Date().toISOString()
        },
        {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true,
        }
      );

      console.log("Modification de la caisse effectuée =>", data);

      // Invalider et rafraîchir le cache pour mettre à jour le tableau
      await queryClient.invalidateQueries({
        queryKey: ["cash-desk-statement"],
      });
      await queryClient.refetchQueries({ queryKey: ["cash-desk-statement"] });

      onClose();
      toast.success(
        `La caisse "${caisseInfo?.name}" a été modifiée avec succès!`
      );
    } catch (err) {
      console.error("Erreur lors de la modification de la caisse :", err);
      setError(
        (err as any)?.response?.data?.message ||
          "Impossible de modifier la caisse"
      );
      toast.error(
        "Impossible de modifier la caisse : " +
          ((err as any)?.response?.data?.message || (err as any)?.message)
      );
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Gérer les changements dans le champ location
   */
  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCaisseData({
      ...caisseData,
      location: e.target.value,
    });
  };

  /**
   * Gérer les changements de statut actif/inactif
   */
  const handleStatusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCaisseData({
      ...caisseData,
      isActive: e.target.checked,
    });
  };

  return (
    <Dialog open={isModalModifOpen} onOpenChange={onClose}>
      <DialogContent
        className="sm:max-w-lg md:max-w-2xl"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>
            Modification de la caisse : <strong>{caisseInfo?.name}</strong>
          </DialogTitle>
          <DialogDescription>
            Modifiez les informations de la caisse.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleModificationSubmit}>
          <div className="grid gap-4 py-4">
            {/* Champ pour l'emplacement */}
            <div className="grid grid-cols-1 items-center gap-4">
              <Label htmlFor="location" className="text-right">
                Emplacement
              </Label>
              <Input
                id="location"
                className="col-span-3"
                type="text"
                placeholder="Emplacement de la caisse"
                value={caisseData.location}
                onChange={handleLocationChange}
                required
                disabled={isLoading}
              />
            </div>

            {/* Champ pour le statut actif/inactif */}
            <div className="flex items-center space-x-2 mt-2">
              <input
                type="checkbox"
                id="isActive"
                checked={caisseData.isActive}
                onChange={handleStatusChange}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                disabled={isLoading}
              />
              <Label htmlFor="isActive">Caisse active</Label>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <DialogFooter className="mt-10">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isLoading}
            >
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
};

/**
 * Modal pour gérer l'approvisionnement des caisses
 *
 * @param isModalApprovisionnerOpen
 * @param onClose
 * @param caisseInfo
 * @constructor
 */
const ApprovisionnerModal = ({
  isModalApprovisionnerOpen,
  onClose,
  caisseInfo,
}: ApprovisionnerModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { data: session } = useSession();
  const [appro, setAppro] = useState({
    montant: 0,
  });
  const queryClient = useQueryClient();

  // Récupérer le token d'authentification
  const token = session?.accessToken;

  const handleApprovisionnementSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault(); // Empêcher le comportement par défaut du formulaire
    setIsLoading(true);
    setError("");
    try {
      const { data } = await $axios.put(
        `/cashdesks/${caisseInfo.id}/allocate-balance`,
        {
          amount: parseFloat(String(appro.montant)), // Conversion en nombre
        },
        {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true,
        }
      );
      console.log("Approvisionnement effectué =>, ", data);

      // Invalider et rafraîchir le cache pour mettre à jour le tableau
      await queryClient.invalidateQueries({
        queryKey: ["cash-desk-statement"],
      });
      await queryClient.refetchQueries({ queryKey: ["cash-desk-statement"] });

      onClose();
      toast.success(
        "L'approvisionnement de la caisse : " +
          caisseInfo?.name +
          " a été effectué avec succès!"
      );
    } catch (err) {
      console.error("Erreur lors de l'approvisionnement de la caisse :", err);
      setError(
        (err as any)?.response?.data?.message ||
          "Impossible de procéder à l'approvisionnement"
      );
      toast.error(
        "Impossible de procéder à l'approvisionnement : " +
          ((err as any)?.response?.data?.message || (err as any)?.message)
      );
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Fonction permettant d'autoriser la saisie que des chiffres et un point décimal
   *
   * @param e
   * @param setStateFunction
   * @param currentState
   * @param fieldName
   */
  const handleMontantChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setStateFunction: (state: any) => void,
    currentState: any,
    fieldName: string
  ) => {
    const value = e.target.value;

    // N'accepter que des chiffres et un point décimal
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setStateFunction({
        ...currentState,
        [fieldName]: value,
      });
    }
  };

  return (
    <Dialog open={isModalApprovisionnerOpen} onOpenChange={onClose}>
      <DialogContent
        className="sm:max-w-lg md:max-w-2xl"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>
            Approvisionnement de la caisse : <strong>{caisseInfo?.name}</strong>
          </DialogTitle>
          <DialogDescription>
            Saisissez le montant que vous souhaitez allouer à cette caisse.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleApprovisionnementSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 items-center gap-4 mt-5">
              <Label htmlFor="montant" className="text-right">
                Montant à allouer
              </Label>
              <Input
                id="montant"
                className="col-span-3"
                type="text"
                inputMode="decimal"
                placeholder="100"
                value={appro.montant}
                onChange={(e) =>
                  handleMontantChange(e, setAppro, appro, "montant")
                }
                required
                disabled={isLoading}
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
          </div>
          <DialogFooter className={"mt-10"}>
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isLoading}
            >
              Fermer
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Traitement en cours..." : "Valider"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export const columns: ColumnDef<
  TransactionColumnSchema & { isClose: boolean }
>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Nom" />
    ),
    cell: ({ row }) => {
      const value = row.getValue("name");
      return <div className="">{`${value}`}</div>;
    },
  },
  {
    accessorKey: "location",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Emplacement" />
    ),
    cell: ({ row }) => {
      const value = row.getValue("location");
      return <div className="">{`${value}`}</div>;
    },
  },
  {
    accessorKey: "allocatedBalance",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Montant alloué" />
    ),
    cell: ({ row }) => {
      const value = row.getValue("allocatedBalance");
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
    accessorKey: "isActive",
    header: "Active / Inactive",

    cell: ({ row }) => {
      const isActive = row.getValue("isActive") ? "true" : "false";
      console.log("isActive =>, ", isActive);
      let variant: "success" | "destructive";

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
    cell: ({ row }) => {
      const isClose = row.getValue("isClose") ? "true" : "false";
      console.log("isClose =>, ", isClose);
      let variant: "success" | "destructive";

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
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const caisse = row.original;
      const [isModalApprovisionnerOpen, setIsModalApprovisionnerOpen] =
        useState(false);
      const [isModalModifOpen, setIsModalModifOpen] = useState(false);
      // const [isModalActiveOpen, setIsModalActiveOpen] = useState(false);
      const [isModalCloseOpen, setIsModalCloseOpen] = useState(false);

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
                  setIsModalModifOpen(true);
                }}
              >
                Modifier les infos
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setIsModalApprovisionnerOpen(true);
                }}
              >
                Approvisionner
              </DropdownMenuItem>
              {/*<DropdownMenuItem*/}
              {/*    onClick={() => {*/}
              {/*        setIsModalActiveOpen(true);*/}
              {/*    }}*/}
              {/*>*/}
              {/*    {caisse?.isActive ? "Désactiver la caisse" : "Activer la caisse"}*/}
              {/*</DropdownMenuItem>*/}
              <DropdownMenuItem
                onClick={() => {
                  setIsModalCloseOpen(true);
                }}
              >
                {caisse?.isClose ? "Ouvrir la caisse" : "Fermer la caisse"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <ApprovisionnerModal
            isModalApprovisionnerOpen={isModalApprovisionnerOpen}
            onClose={() => setIsModalApprovisionnerOpen(false)}
            caisseInfo={caisse}
          />

          <ModifModal
            isModalModifOpen={isModalModifOpen}
            onClose={() => setIsModalModifOpen(false)}
            caisseInfo={caisse}
          />

          {/*<ActiveModal*/}
          {/*    isModalActiveOpen={isModalActiveOpen}*/}
          {/*    onClose={() => setIsModalActiveOpen(false)}*/}
          {/*    caisseInfo={caisse}*/}
          {/*/>*/}

          <CloseModal
            isModalCloseOpen={isModalCloseOpen}
            onClose={() => setIsModalCloseOpen(false)}
            caisseInfo={caisse}
          />
        </>
      );
    },
  },
];
