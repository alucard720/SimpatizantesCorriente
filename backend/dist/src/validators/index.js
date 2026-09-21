import { z } from "zod";
import { normalizeCedula } from "../lib/crypto.js";
const name = z.string().trim().min(1).max(100);
export const uuid = z.string().uuid();
export const phone = z
    .string()
    .trim()
    .regex(/^\+?[0-9 ()-]{10,24}$/)
    .transform((v) => v.replace(/[ ()-]/g, ""))
    .refine((v) => /^\+?[0-9]{10,15}$/.test(v), "Teléfono inválido");
export const password = z.string().min(12).max(128);
export const registrationInput = z
    .object({
    firstName: name,
    lastName: name,
    cedula: z
        .string()
        .max(20)
        .transform(normalizeCedula)
        .refine((v) => /^\d{11}$/.test(v), "La cédula requiere 11 dígitos"),
    phone,
    provinceId: uuid,
    seccionalId: uuid,
    schoolId: uuid.optional(),
    schoolName: z.string().trim().min(2).max(200).optional(),
    consent: z.literal(true),
    consentVersion: z.string().min(1).max(40),
    captchaToken: z.string().max(2048).optional(),
})
    .strict()
    .refine((v) => !(v.schoolId && v.schoolName), "Seleccione una escuela o escriba el nombre, no ambos");
export const loginInput = z
    .object({
    email: z
        .string()
        .trim()
        .email()
        .max(254)
        .transform((v) => v.toLowerCase()),
    password: z.string().min(1).max(128),
})
    .strict();
export const userInput = z
    .object({
    firstName: name,
    lastName: name,
    email: z
        .string()
        .trim()
        .email()
        .max(254)
        .transform((v) => v.toLowerCase()),
    password,
    phone: phone.optional(),
    role: z.enum(["ADMIN", "LEADER"]),
    leaderId: uuid.optional(),
})
    .strict()
    .refine((v) => (v.role === "LEADER" ? !!v.leaderId : !v.leaderId), "LEADER requiere leaderId; ADMIN no debe tener líder");
export const pageInput = z.object({
    page: z.coerce.number().int().min(1).max(100000).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(25),
});
export const listInput = pageInput.extend({
    seccionalId: uuid.optional(),
    status: z.enum(["PENDING", "VERIFIED", "ARCHIVED"]).optional(),
});
export const statusInput = z
    .object({ status: z.enum(["PENDING", "VERIFIED", "ARCHIVED"]) })
    .strict();
export const reasonInput = z
    .object({ reason: z.string().trim().min(10).max(300) })
    .strict();
export const provinceInput = z
    .object({ code: z.string().trim().min(1).max(20), name })
    .strict();
export const seccionalInput = z.object({
    provinceId: uuid,
    number: z.coerce.number().int().positive(),
    name: z.string().trim().min(1).max(150),
}).strict();
export const schoolInput = z
    .object({
    seccionalId: uuid,
    code: z.string().trim().min(1).max(30).optional(),
    name: z.string().trim().min(2).max(200),
})
    .strict();
export const assignmentInput = z
    .object({
    seccionalIds: z
        .array(uuid)
        .max(500)
        .refine((v) => new Set(v).size === v.length),
})
    .strict();
