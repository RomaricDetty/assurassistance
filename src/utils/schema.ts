import {z} from "zod";

export const loginSchema = z.object({
    phoneNumber: z.string().min(10, {
        message: "Le numéro de téléphone est requis",
    }),
    password: z.string().min(6, {
        message: "Le mot de passe est requis",
    }),
});

export const loginModifPwdSchema = z.object({
    phoneNumber: z.string().min(10, {
        message: "Le numéro de téléphone est requis",
    }),
    oldPassword: z.string().min(6, {
        message: "L'actuel mot de passe est requis",
    }),
    newPassword: z.string().min(6, {
        message: "Le nouveau mot de passe est requis",
    }),
})
