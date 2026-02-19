/* eslint-disable @typescript-eslint/no-explicit-any */

"use client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import $axios from "@/lib/axios";
import { cn } from "@/lib/utils";
import { loginModifPwdSchema, loginSchema } from "@/utils/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { Key, Lock } from "lucide-react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"form">) {
  const router = useRouter();
  const [modifPwd, setModifPwd] = useState(false);
  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      phoneNumber: "",
      password: "",
    },
  });

  const formUpdate = useForm<z.infer<typeof loginModifPwdSchema>>({
    resolver: zodResolver(loginModifPwdSchema),
    defaultValues: {
      phoneNumber: "",
      oldPassword: "",
      newPassword: "",
    },
  });

  /**
   * Fonction pour le login
   *
   * @param values
   */
  async function onSubmit(values: z.infer<typeof loginSchema>) {
    const formData = new FormData();
    formData.append("phoneNumber", values.phoneNumber);
    formData.append("password", values.password);

    const res = await signIn("credentials", {
      phone: values.phoneNumber,
      password: values.password,
      redirect: false, // important !
    });

    console.log("res =>, ", res);

    if (res?.error) {
      if (res?.error === "Configuration") {
        console.log("Configuration du nouveau mdp");
        setModifPwd(true);
        return false;
      }
      // Ici, identifiants incorrects
      toast.error("Identifiants incorrects");
    } else {
      // Connexion réussie
      toast.success("Connexion réussie");
      // Redirige si besoin
      router.push("/dashboard");
    }
  }

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
      setModifPwd(false);
    } catch (err) {
      console.error("Erreur lors de la modification du mot de passe :", err);
      toast.error(
        "Impossible de modifier le mot de passe : " +
          ((err as any)?.response?.data?.message || (err as any)?.message)
      );
    }
  }

  return (
    <>
      {/* Authentification */}
      {!modifPwd && (
        <Form {...form}>
          <form
            className={cn("flex flex-col gap-6", className)}
            {...props}
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <div className="flex flex-col items-center gap-2 text-center">
              <h1 className="text-2xl font-bold flex flex-col items-center gap-3">
                <Lock />
                <span>Connexion à votre compte</span>
              </h1>
              <p className="text-balance text-sm text-muted-foreground">
                Entrez votre numéro de téléphone et votre mot de passe pour vous
                connecter
              </p>
            </div>
            <div className="grid gap-6">
              <div className="grid gap-2">
                <FormField
                  control={form.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Numéro de téléphone</FormLabel>
                      <FormControl>
                        <Input
                          id="phoneNumber"
                          type="text"
                          placeholder="06 06 06 06 06"
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
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center">
                        <FormLabel htmlFor="password">Mot de passe</FormLabel>
                        {/*<a*/}
                        {/*    href="#"*/}
                        {/*    className="ml-auto text-sm underline-offset-4 hover:underline"*/}
                        {/*>*/}
                        {/*    Mot de passe oublié ?*/}
                        {/*</a>*/}
                      </div>
                      <FormControl>
                        <PasswordInput
                          id="password"
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
              <Button
                type="submit"
                className="w-full py-5 cursor-pointer"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? "Connexion..." : "Connexion"}
              </Button>
            </div>
          </form>
        </Form>
      )}

      {/* Modification du mot de passe */}
      {modifPwd && (
        <Form {...formUpdate}>
          <form
            className={cn("flex flex-col gap-6", className)}
            {...props}
            onSubmit={formUpdate.handleSubmit(onSubmitModif)}
          >
            <div className="flex flex-col items-center gap-2 text-center">
              <h1 className="text-2xl font-bold flex flex-col items-center gap-3">
                <Key />
                <span>Modification du mot de passe</span>
              </h1>
              <p className="text-balance text-sm text-muted-foreground">
                Modifiez votre mot de passe afin de vous connecter à votre
                compte.
              </p>
            </div>
            <div className="grid gap-6">
              <div className="grid gap-2">
                <FormField
                  control={formUpdate.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Numéro de téléphone</FormLabel>
                      <FormControl>
                        <Input
                          id="phoneNumber"
                          type="text"
                          placeholder="06 06 06 06 06"
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
              <Button
                type="submit"
                className="w-full py-5 cursor-pointer"
                disabled={formUpdate.formState.isSubmitting}
              >
                {formUpdate.formState.isSubmitting
                  ? "Modification..."
                  : "Modifier"}
              </Button>
            </div>
          </form>
        </Form>
      )}
    </>
  );
}
