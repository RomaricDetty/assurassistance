/* eslint-disable @typescript-eslint/no-explicit-any */

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PageContainer from "@/components/layout/page-container";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import $axios from "@/lib/axios";
import { ArrowRight, Send, ShoppingCart } from "lucide-react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

export default function CompteTransfertsPage() {
  // État pour les différentes modales
  const [isRapideModalOpen, setIsRapideModalOpen] = useState(false);
  const [isMarchandModalOpen, setIsMarchandModalOpen] = useState(false);
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [errorMarchand, setErrorMarchand] = useState("");

  // Récupérer le token d'authentification
  const token = session?.accessToken;

  // État pour les formulaires
  const [transfertRapide, setTransfertRapide] = useState({
    numero: "",
    montant: "",
  });

  const [transfertMarchand, setTransfertMarchand] = useState({
    telephone: "",
    montant: "",
  });

  // Fonction pour valider que seuls des chiffres sont saisis
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

  /**
   * Transfert Rapide
   *
   * @param e
   */
  const handleRapideSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("Transfert rapide: ", transfertRapide);
    setIsLoading(true);
    setError("");
    try {
      const { data } = await $axios.post(
        `/transfer/quick`,
        {
          toPhone: transfertRapide.numero,
          amount: parseInt(transfertRapide.montant),
        },
        {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true,
        }
      );
      console.log("Transfert rapide =>, ", data);

      if (data?.status === 200) {
        setIsRapideModalOpen(false);
        toast.success(
          "Le transfert rapide vers le " +
            transfertRapide.numero +
            " a été effectué avec succès!"
        );
        return false;
      }

      toast.error(
        data?.message ||
          "Une erreur est survenue lors du transfert rapide vers le " +
            transfertRapide.numero
      );
    } catch (err) {
      console.error("Erreur lors du transfert rapide : ", err);
      setError(
        (err as any)?.response?.data?.message ||
          "Impossible de procéder au transfert rapide"
      );
      toast.error(
        "Impossible de procéder au transfert rapide : " +
          ((err as any)?.response?.data?.message || (err as any)?.message)
      );
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Transfert Marchand
   *
   * @param e
   */
  const handleMarchandSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("Transfert marchand : ", transfertMarchand);
    setIsLoading(true);
    setErrorMarchand("");
    try {
      const { data } = await $axios.post(
        `/transfer/merchant`,
        {
          toUserPhone: transfertMarchand.telephone,
          amount: parseInt(transfertMarchand.montant),
        },
        {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true,
        }
      );
      console.log("Transfert marchand =>, ", data);

      setIsMarchandModalOpen(false);
      toast.success(
        "Le transfert marchand vers le " +
          transfertMarchand.telephone +
          " a été effectué avec succès!"
      );
    } catch (err) {
      console.error("Erreur lors du transfert marchand :", err);
      setErrorMarchand(
        (err as any)?.response?.data?.message ||
          "Impossible de procéder au transfert marchand"
      );
      toast.error(
        "Impossible de procéder au transfert marchand : " +
          ((err as any)?.response?.data?.message || (err as any)?.message)
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageContainer>
      <div className="flex flex-col space-y-6">
        <div className="flex items-start justify-between">
          <Heading
            title="Transferts"
            description="Gérer vos transferts d'argent."
          />
        </div>
        <Separator />

        <div className="flex justify-center items-center mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
            {/* Carte Transfert Rapide */}
            <Card className="transition-all hover:shadow-md">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl">Transfert Rapide</CardTitle>
                  <Send className="h-10 w-10 text-primary" />
                </div>
                <CardDescription>Transfert d&apos;argent rapide.</CardDescription>
              </CardHeader>
              <CardContent className="py-6">
                <p className="text-md text-muted-foreground">
                  Parfait pour transférer de l&apos;argent à une personne
                  n&apos;ayant pas de compte monpote.
                </p>
              </CardContent>
              <CardFooter className={"flex items-center justify-end"}>
                <Button
                  variant="secondary"
                  className="p-6 cursor-pointer border-2"
                  onClick={() => setIsRapideModalOpen(true)}
                >
                  Transfert rapide
                </Button>
              </CardFooter>
            </Card>
            {/* Carte Transfert Rapide */}

            {/* Carte Transfert par Marchand */}
            <Card className="transition-all hover:shadow-md">
              <CardHeader className="bg-secondary/5">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl">Transfert Marchand</CardTitle>
                  <div className="flex items-center gap-1">
                    <ShoppingCart className="h-10 w-10" />{" "}
                    <ArrowRight className="h-6 w-6" />
                  </div>
                </div>
                <CardDescription>
                  Transfert d&apos;argent vers un utilisateur.
                </CardDescription>
              </CardHeader>
              <CardContent className="py-6">
                <p className="text-md text-muted-foreground">
                  Idéal pour transférer de l&apos;argent depuis votre compte marchand
                  vers un utilisateur de monpote.
                </p>
              </CardContent>
              <CardFooter className={"flex items-center justify-end"}>
                <Button
                  className="p-6 cursor-pointer border-2"
                  onClick={() => setIsMarchandModalOpen(true)}
                >
                  Transfert marchand
                </Button>
              </CardFooter>
            </Card>
            {/* Carte Transfert par Marchand */}
          </div>
        </div>

        {/* Dialog Pour le transfert rapide */}
        <Dialog open={isRapideModalOpen} onOpenChange={setIsRapideModalOpen}>
          <DialogContent
            className="sm:max-w-lg md:max-w-2xl"
            onPointerDownOutside={(e) => e.preventDefault()}
          >
            <form onSubmit={handleRapideSubmit}>
              <DialogHeader className={"mb-10"}>
                <DialogTitle>Transfert Rapide</DialogTitle>
                <DialogDescription>
                  Effectuez un transfert immédiat vers un numéro n&apos;ayant pas de
                  compte monpote.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-1 items-center gap-4">
                  <Label htmlFor="numero" className="text-right">
                    Numéro de téléphone
                  </Label>
                  <Input
                    id="numero"
                    className="col-span-3"
                    placeholder="Numéro de compte"
                    value={transfertRapide.numero}
                    onChange={(e) =>
                      setTransfertRapide({
                        ...transfertRapide,
                        numero: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div className="grid grid-cols-1 items-center gap-4 mt-5">
                  <Label htmlFor="montant" className="text-right">
                    Montant à transférer
                  </Label>
                  <Input
                    id="montant"
                    className="col-span-3"
                    type="text"
                    inputMode="decimal"
                    placeholder="100"
                    value={transfertRapide.montant}
                    onChange={(e) =>
                      handleMontantChange(
                        e,
                        setTransfertRapide,
                        transfertRapide,
                        "montant"
                      )
                    }
                    required
                  />
                </div>

                {error && (
                  <p className="text-sm text-destructive mt-2">{error}</p>
                )}
              </div>
              <DialogFooter className={"mt-10"}>
                <Button type="submit" className={"p-5"} disabled={isLoading}>
                  {isLoading
                    ? "Transfert en cours..."
                    : "Confirmer le transfert"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        {/* Dialog Pour le transfert rapide */}

        {/* Dialog Pour le transfert marchand */}
        <Dialog
          open={isMarchandModalOpen}
          onOpenChange={setIsMarchandModalOpen}
        >
          <DialogContent
            className="sm:max-w-lg md:max-w-2xl"
            onPointerDownOutside={(e) => e.preventDefault()}
          >
            <form onSubmit={handleMarchandSubmit}>
              <DialogHeader className={"mb-10"}>
                <DialogTitle>Transfert Marchand</DialogTitle>
                <DialogDescription>
                  Effectuez un transfert vers un utilisateur monpote.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-1 items-center gap-4">
                  <Label htmlFor="telephone" className="text-right">
                    Numéro de téléphone
                  </Label>
                  <Input
                    id="telephone"
                    className="col-span-3"
                    placeholder="Numéro de téléphone"
                    value={transfertMarchand.telephone}
                    onChange={(e) =>
                      setTransfertMarchand({
                        ...transfertMarchand,
                        telephone: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div className="grid grid-cols-1 items-center gap-4 mt-5">
                  <Label htmlFor="montant-marchand" className="text-right">
                    Montant à transférer
                  </Label>
                  <Input
                    id="montant-marchand"
                    className="col-span-3"
                    type="text"
                    inputMode="decimal"
                    placeholder="100"
                    value={transfertMarchand.montant}
                    onChange={(e) =>
                      handleMontantChange(
                        e,
                        setTransfertMarchand,
                        transfertMarchand,
                        "montant"
                      )
                    }
                    required
                  />
                </div>

                {errorMarchand && (
                  <p className="text-sm text-destructive mt-2">
                    {errorMarchand}
                  </p>
                )}
              </div>
              <DialogFooter className={"mt-10"}>
                <Button type="submit" className={"p-5"} disabled={isLoading}>
                  {isLoading
                    ? "Transfert en cours..."
                    : "Confirmer le transfert"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        {/* Dialog Pour le transfert marchand */}
      </div>
    </PageContainer>
  );
}
