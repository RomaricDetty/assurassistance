/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import $axios from "@/lib/axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";

// Schéma de validation pour le formulaire d'ajout de caissier
const formSchema = z.object({
    email: z.string().min(1, { message: "L'adresse e-mail est requise" }),
    phone: z.string().min(1, { message: "Le numéro de téléphone est requis" }),
    firstName: z.string().min(1, { message: "Le nom est requis" }),
    lastName: z.string().min(1, { message: "Le prénom est requis" }),
});

type FormValues = z.infer<typeof formSchema>;

export function AddCashierModal() {
    const { data: session } = useSession();
    const token = session?.accessToken;

    const [open, setOpen] = useState(false);
    const queryClient = useQueryClient();
    const [error, setError] = useState("");

    // Configuration du formulaire avec react-hook-form et zod
    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: "",
            phone: "",
            firstName: "",
            lastName: ""
        },
    });

    // Mutation pour ajouter un nouveau caissier
    const { mutate, isPending } = useMutation({
        mutationFn: async (values: FormValues) => {
            const { data } = await $axios.post("/users", {
                phone: values.phone,
                email: values.email,
                firstName: values.firstName,
                lastName : values.lastName,
                userType: "CASHIER",
                roleNames: ["ROLE_CASHIER"]
            }, {
                headers: {
                    Accept: "application/json",
                    Authorization: token ? `Bearer ${token}` : '',
                },
                withCredentials: true,
            });
            return data;
        },
        onSuccess: () => {
            // Invalider le cache pour recharger les données
            queryClient.invalidateQueries({queryKey: ["cashier-desk-statement"]});
            // Rafraîchir immédiatement
            queryClient.refetchQueries({queryKey: ["cashier-desk-statement"]});

            toast.success("Caissier ajouté avec succès");
            form.reset();
            setOpen(false);
        },
        onError: (error) => {
            console.error("Erreur lors de l'ajout du caissier :", error);
            setError((error as any)?.response?.data?.message || "Erreur lors de l'ajout du caissier");
            toast.error("Erreur lors de l'ajout du caissier");
        },
    });

    /**
     * Soumission du formulaire
     *
     * @param values
     */
    function onSubmit(values: FormValues) {
        mutate(values);
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    Ajouter un caissier <Plus className="ml-2 h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg md:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Ajouter un nouveau caissier</DialogTitle>
                    <DialogDescription>
                        Créez un nouveau caissier pour votre commerce.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem className={"my-10"}>
                                    <FormLabel>Adresse e-mail</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ex: monadresse@email.test" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                                <FormItem className={"my-10"}>
                                    <FormLabel>Numéro de téléphone</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ex: 0707070707" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="firstName"
                            render={({ field }) => (
                                <FormItem className={"my-10"}>
                                    <FormLabel>Nom</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ex: Nom" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="lastName"
                            render={({ field }) => (
                                <FormItem className={"my-10"}>
                                    <FormLabel>Prénom(s)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ex: Mon prénom" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {error && <p className="text-sm text-destructive">{error}</p>}

                        <DialogFooter>
                            <Button
                                type="submit"
                                disabled={isPending}
                                className="w-full"
                            >
                                {isPending ? "Création en cours..." : "Créer le caissier"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
