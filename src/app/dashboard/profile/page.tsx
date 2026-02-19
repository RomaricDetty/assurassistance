/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import PageContainer from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Heading } from "@/components/ui/heading";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Separator } from "@/components/ui/separator";
import $axios from "@/lib/axios";
import { loginModifPwdSchema } from "@/utils/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { ShieldCheck, UserCircle } from "lucide-react";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

export default function ProfilePage() {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const id = session?.id;

  const [isEditing, setIsEditing] = useState(false);
  const [menuItem, setMenuItem] = useState("account");

  const { data: profileData, isLoading } = useQuery({
    queryKey: ["profile-info"],
    queryFn: async () => {
      // Vérifier que le token est disponible
      if (!token) return null;

      const { data } = await $axios.get?.("/users/" + id, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
        params: {},
      });

      return data;
    },
    // Ne pas exécuter la requête si le token n'est pas disponible
    enabled: !!token,
  });

  const formUpdate = useForm<z.infer<typeof loginModifPwdSchema>>({
    resolver: zodResolver(loginModifPwdSchema),
    defaultValues: {
      phoneNumber: "",
      oldPassword: "",
      newPassword: "",
    },
  });

  // Mettre à jour les valeurs du formulaire quand les données du profil sont chargées
  useEffect(() => {
    if (profileData?.phone) {
      formUpdate.setValue("phoneNumber", profileData.phone);
    }
  }, [profileData, formUpdate]);

  /**
   * Fonction pour modifier le mot de passe
   *
   * @param values
   */
  async function onSubmitModif(values: z.infer<typeof loginModifPwdSchema>) {
    try {
      const { data } = await $axios.post(
        `/auth/login-w/update-password`,
        {
          phone: values.phoneNumber,
          oldPassword: values.oldPassword,
          newPassword: values.newPassword,
        },
        {}
      );

      console.log("Modification du mot de passe effectuée =>", data);
      toast.success(`Vous avez modifié votre mot de passe avec succès!`);
      setIsEditing(false);
      // Réinitialiser le formulaire après succès
      formUpdate.reset({
        phoneNumber: profileData?.phone || "",
        oldPassword: "",
        newPassword: "",
      });
    } catch (err) {
      console.error("Erreur lors de la modification du mot de passe :", err);
      toast.error(
        "Impossible de modifier le mot de passe : " +
          ((err as any)?.response?.data?.message || (err as any)?.message)
      );
    }
  }

  /**
   * Fonction pour changer de menu item entre Profil et Sécurité
   *
   * le @param item est soit égal à account, soit égal à security
   *
   * @param item
   */
  const handleMenuItemChange = (item: string) => {
    setMenuItem(item);
  };

  const handleUpdatePassword = () => {
    setIsEditing(true);
    // S'assurer que le numéro de téléphone est bien défini quand on ouvre le formulaire
    if (profileData?.phone) {
      formUpdate.setValue("phoneNumber", profileData.phone);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    // Réinitialiser le formulaire en cas d'annulation
    formUpdate.reset({
      phoneNumber: profileData?.phone || "",
      oldPassword: "",
      newPassword: "",
    });
  };

  return (
    <PageContainer>
      <div className="flex flex-1 flex-col space-y-4">
        <div className="flex items-start justify-between">
          <Heading
            title="Profil"
            description="Vérifier et modifier les informations de votre profil"
          />
        </div>
        <Separator />

        {/* Profile content */}
        <div className="mt-5">
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4">Chargement...</p>
              </div>
            </div>
          ) : (
            <Card className="mx-auto rounded-lg overflow-hidden">
              <div className="grid md:grid-cols-4 grid-cols-1">
                {/* Left sidebar */}
                <div className="p-6 xs:border-b sm:border-b md:border-r md:border-b-0 border-gray">
                  <h2 className="text-xl font-semibold mb-1">
                    Profil Marchand
                  </h2>
                  <p className="text-gray-400 text-sm mb-6">
                    Gérer les infos de votre compte.
                  </p>

                  <div className="space-y-1">
                    <div
                      className={
                        menuItem === "account"
                          ? "flex items-center space-x-3 p-2 rounded-md bg-muted cursor-pointer"
                          : "flex items-center space-x-3 p-2 cursor-pointer"
                      }
                      onClick={() => handleMenuItemChange("account")}
                    >
                      <UserCircle size={20} />
                      <span>Compte</span>
                    </div>
                    <div
                      className={
                        menuItem === "security"
                          ? "flex items-center space-x-3 p-2 rounded-md bg-muted cursor-pointer"
                          : "flex items-center space-x-3 p-2 cursor-pointer"
                      }
                      onClick={() => handleMenuItemChange("security")}
                    >
                      <ShieldCheck size={20} />
                      <span>Sécurité</span>
                    </div>
                  </div>
                </div>
                {/* Left sidebar */}

                {/* Main content */}
                {/* Compte */}
                {menuItem === "account" && (
                  <div className="col-span-3 p-6">
                    <h2 className="text-xl font-semibold">Détails</h2>
                    <div className="mt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1">
                          <div className="w-8 h-8 text-sm font-bold bg-muted rounded-[10] border-2 flex items-center justify-center">
                            {profileData?.businessName
                              ?.substring(0, 2)
                              .toUpperCase()}
                          </div>
                          <div>
                            <h3 className="font-medium">
                              {profileData?.businessName}
                            </h3>
                          </div>
                        </div>
                      </div>

                      <div className="mt-8">
                        <h3 className="text-sm font-medium text-gray-400">
                          Adresse e-mail
                        </h3>
                        <div className="mt-2 flex items-center justify-between">
                          <div className="flex-1">
                            <p>{profileData?.email}</p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-8">
                        <h3 className="text-sm font-medium text-gray-400">
                          Emplacement
                        </h3>
                        <div className="mt-2 flex items-center justify-between">
                          <div className="flex-1">
                            <p>{profileData?.address}</p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-8">
                        <h3 className="text-sm font-medium text-gray-400">
                          Numéro de téléphone
                        </h3>
                        <div className="mt-2 flex items-center justify-between">
                          <div className="flex-1">
                            <p>{profileData?.phone}</p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-8">
                        <h3 className="text-sm font-medium text-gray-400">
                          Propriétaire du compte
                        </h3>
                        <div className="mt-2 flex items-center justify-between">
                          <div className="flex-1">
                            <p>{profileData?.businessOwnerName}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Sécurité */}
                {menuItem === "security" && (
                  <div className="col-span-3 p-6">
                    <h2 className="text-xl font-semibold">Sécurité</h2>
                    {!isEditing && (
                      <div className="mt-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-10">
                            <div>
                              <h3 className="font-medium">Mot de passe</h3>
                            </div>

                            <div>
                              <h3 className="font-bold">•••••••••••••</h3>
                            </div>
                          </div>
                          <Button
                            className="cursor-pointer border-2"
                            onClick={handleUpdatePassword}
                          >
                            Modifier
                          </Button>
                        </div>
                      </div>
                    )}
                    {isEditing && (
                      <div className="mt-6">
                        <div className="bg-muted p-4 rounded-md">
                          <h3 className="text-lg font-medium mb-10">
                            Modification du mot de passe
                          </h3>

                          <Form {...formUpdate}>
                            <form
                              className="flex flex-col gap-6"
                              onSubmit={formUpdate.handleSubmit(onSubmitModif)}
                            >
                              <div className="grid gap-6">
                                <div className="grid gap-2">
                                  <FormField
                                    control={formUpdate.control}
                                    name="phoneNumber"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>
                                          Numéro de téléphone
                                        </FormLabel>
                                        <FormControl>
                                          <Input
                                            id="phoneNumber"
                                            type="text"
                                            placeholder="06 06 06 06 06"
                                            required
                                            disabled={true}
                                            className="px-3 py-5"
                                            {...field}
                                          />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                </div>
                                <div className="grid gap-2">
                                  <FormField
                                    control={formUpdate.control}
                                    name="oldPassword"
                                    render={({ field }) => (
                                      <FormItem>
                                        <div className="flex items-center">
                                          <FormLabel htmlFor="oldPassword">
                                            Actuel mot de passe
                                          </FormLabel>
                                        </div>
                                        <FormControl>
                                          <PasswordInput
                                            id="oldPassword"
                                            required
                                            className="px-3 py-5"
                                            {...field}
                                          />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                </div>
                                <div className="grid gap-2">
                                  <FormField
                                    control={formUpdate.control}
                                    name="newPassword"
                                    render={({ field }) => (
                                      <FormItem>
                                        <div className="flex items-center">
                                          <FormLabel htmlFor="newPassword">
                                            Nouveau mot de passe
                                          </FormLabel>
                                          {/*<a*/}
                                          {/*    onClick={generatePassword}*/}
                                          {/*    href="#"*/}
                                          {/*    className="ml-auto text-sm underline-offset-4 hover:underline"*/}
                                          {/*>*/}
                                          {/*    Générer un mot de passe*/}
                                          {/*</a>*/}
                                        </div>
                                        <FormControl>
                                          <PasswordInput
                                            id="newPassword"
                                            required
                                            className="px-3 py-5"
                                            {...field}
                                          />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                </div>
                                <div className="flex justify-end space-x-2 mt-10">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    className="border-gray-600 text-gray-300 hover:bg-gray-800"
                                    onClick={handleCancelEdit}
                                  >
                                    Annuler
                                  </Button>
                                  <Button
                                    type="submit"
                                    className="py-5 cursor-pointer"
                                    disabled={formUpdate.formState.isSubmitting}
                                  >
                                    {formUpdate.formState.isSubmitting
                                      ? "Modification..."
                                      : "Modifier"}
                                  </Button>
                                </div>
                              </div>
                            </form>
                          </Form>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {/* Main content */}
              </div>
            </Card>
          )}
        </div>
        {/* Profile content */}
      </div>
    </PageContainer>
  );
}
