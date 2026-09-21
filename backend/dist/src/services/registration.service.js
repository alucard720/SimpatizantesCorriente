import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { db } from "../lib/db.js";
import { encrypt, decrypt, cedulaDigest } from "../lib/crypto.js";
import { env } from "../config/env.js";
import { HttpError } from "../lib/errors.js";
import { registrationInput, listInput, reasonInput, uuid, statusInput, } from "../validators/index.js";
import { audit } from "../repositories/audit.repository.js";
import { registrationScope, publicRegistrationSelect, } from "../repositories/registration.repository.js";
import { verifyCaptcha } from "./captcha.service.js";
export async function register(raw, ctx) {
    const input = registrationInput.parse(raw);
    if (input.consentVersion !== env.PRIVACY_VERSION)
        throw new HttpError(400, "El aviso de privacidad cambió; recargue la página");
    await verifyCaptcha(input.captchaToken);
    const id = randomUUID();
    try {
        await db.$transaction(async (tx) => {
            const seccional = await tx.seccional.findFirst({
                where: {
                    id: input.seccionalId,
                    number: { not: null },
                    provinceId: input.provinceId,
                    active: true,
                    province: { active: true },
                },
            });
            if (!seccional)
                throw new HttpError(400, "Seccional no válida para la provincia");
            if (input.schoolId &&
                !(await tx.school.findFirst({
                    where: {
                        id: input.schoolId,
                        seccionalId: input.seccionalId,
                        active: true,
                    },
                })))
                throw new HttpError(400, "Escuela no válida para la seccional");
            await tx.registration.create({
                data: {
                    id,
                    firstName: input.firstName,
                    lastName: input.lastName,
                    cedulaEncrypted: encrypt(input.cedula, `registration:${id}:cedula`),
                    cedulaHmac: cedulaDigest(input.cedula),
                    phoneEncrypted: encrypt(input.phone, `registration:${id}:phone`),
                    seccionalId: input.seccionalId,
                    schoolId: input.schoolId,
                    schoolName: input.schoolName,
                    consentVersion: input.consentVersion,
                },
            });
            await audit(tx, ctx, "REGISTRATION_CREATED", "Registration", id);
        });
    }
    catch (error) {
        // Misma respuesta en duplicados, sin devolver identificadores ni confirmar afiliación.
        if (!(error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === "P2002" &&
            Array.isArray(error.meta?.target) &&
            error.meta.target.includes("cedula_hmac")))
            throw error;
    }
    return {
        message: "Solicitud recibida. Si los datos permiten un registro nuevo, será procesado.",
    };
}
export async function listRegistrations(raw, auth, ctx) {
    const query = listInput.parse(raw);
    const where = {
        AND: [
            registrationScope(auth),
            { seccionalId: query.seccionalId, status: query.status },
        ],
    };
    return db.$transaction(async (tx) => {
        const [items, total] = await Promise.all([
            tx.registration.findMany({
                where,
                select: publicRegistrationSelect,
                orderBy: [{ createdAt: "desc" }, { id: "desc" }],
                skip: (query.page - 1) * query.pageSize,
                take: query.pageSize,
            }),
            tx.registration.count({ where }),
        ]);
        await audit(tx, ctx, "REGISTRATION_LISTED", "Registration");
        return { items, total, page: query.page, pageSize: query.pageSize };
    });
}
export async function sensitiveData(idRaw, raw, ctx) {
    const id = uuid.parse(idRaw);
    const { reason } = reasonInput.parse(raw);
    return db.$transaction(async (tx) => {
        const record = await tx.registration.findUnique({ where: { id } });
        if (!record)
            throw new HttpError(404, "Registro no encontrado");
        const data = {
            cedula: decrypt(record.cedulaEncrypted, `registration:${id}:cedula`),
            phone: decrypt(record.phoneEncrypted, `registration:${id}:phone`),
        };
        await audit(tx, ctx, "SENSITIVE_DATA_READ", "Registration", id, reason);
        return data;
    });
}
export async function updateStatus(idRaw, raw, auth, ctx) {
    const id = uuid.parse(idRaw);
    const { status } = statusInput.parse(raw);
    return db.$transaction(async (tx) => {
        const result = await tx.registration.updateMany({
            where: { AND: [{ id }, registrationScope(auth)] },
            data: { status },
        });
        if (!result.count)
            throw new HttpError(404, "Registro no encontrado");
        await audit(tx, ctx, "REGISTRATION_UPDATED", "Registration", id, `Estado: ${status}`);
        return { id, status };
    });
}
