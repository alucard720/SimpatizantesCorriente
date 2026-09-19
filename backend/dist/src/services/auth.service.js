import { randomUUID } from "node:crypto";
import { db } from "../lib/db.js";
import { env } from "../config/env.js";
import { hashPassword, verifyPassword, sessionToken, tokenDigest, encrypt, } from "../lib/crypto.js";
import { HttpError } from "../lib/errors.js";
import { audit } from "../repositories/audit.repository.js";
import { loginInput, userInput } from "../validators/index.js";
const dummyHash = hashPassword("unused-random-" + randomUUID());
export const cookieOptions = {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/api",
};
export async function login(raw, ctx) {
    const input = loginInput.parse(raw);
    const user = await db.user.findUnique({
        where: { email: input.email },
        include: { role: true, leader: true },
    });
    const valid = await verifyPassword(input.password, user?.passwordHash ?? (await dummyHash));
    const token = sessionToken();
    const accepted = await db.$transaction(async (tx) => {
        // Serializar intentos simultáneos para que no eludan el bloqueo por cuenta.
        if (user)
            await tx.$queryRaw `SELECT id FROM users WHERE id = ${user.id}::uuid FOR UPDATE`;
        const current = user
            ? await tx.user.findUnique({
                where: { id: user.id },
                include: { role: true, leader: true },
            })
            : null;
        const locked = current?.lockedUntil && current.lockedUntil > new Date();
        if (!current ||
            !valid ||
            current.passwordHash !== user?.passwordHash ||
            !current.active ||
            !current.role.active ||
            locked ||
            (current.role.code === "LEADER" && !current.leader?.active)) {
            if (current && !locked) {
                const attempts = current.lockedUntil ? 1 : current.failedAttempts + 1;
                await tx.user.update({
                    where: { id: current.id },
                    data: {
                        failedAttempts: attempts,
                        lockedUntil: attempts >= 5 ? new Date(Date.now() + 15 * 60_000) : null,
                    },
                });
            }
            await audit(tx, { ...ctx, actorId: current?.id }, "LOGIN_FAILURE", "User", current?.id);
            return null;
        }
        await tx.user.update({
            where: { id: current.id },
            data: { failedAttempts: 0, lockedUntil: null, lastLoginAt: new Date() },
        });
        await tx.session.deleteMany({
            where: { userId: current.id, expiresAt: { lte: new Date() } },
        });
        await tx.session.create({
            data: {
                userId: current.id,
                tokenHash: tokenDigest(token),
                expiresAt: new Date(Date.now() + 8 * 60 * 60_000),
            },
        });
        await audit(tx, { ...ctx, actorId: current.id }, "LOGIN_SUCCESS", "User", current.id);
        return {
            id: current.id,
            firstName: current.firstName,
            lastName: current.lastName,
            role: current.role.code,
        };
    });
    if (!accepted)
        throw new HttpError(401, "Credenciales inválidas o acceso temporalmente bloqueado");
    return { user: accepted, token };
}
export async function createUser(raw, ctx) {
    const input = userInput.parse(raw);
    const id = randomUUID();
    const passwordHash = await hashPassword(input.password);
    return db.$transaction(async (tx) => {
        const role = await tx.role.findUniqueOrThrow({
            where: { code: input.role },
        });
        if (input.role === "LEADER" &&
            !(await tx.leader.findFirst({
                where: { id: input.leaderId, active: true },
            })))
            throw new HttpError(400, "Líder inválido");
        const user = await tx.user.create({
            data: {
                id,
                firstName: input.firstName,
                lastName: input.lastName,
                email: input.email,
                passwordHash,
                roleId: role.id,
                phoneEncrypted: input.phone
                    ? encrypt(input.phone, `user:${id}:phone`)
                    : null,
                leaderId: input.leaderId,
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                active: true,
                leader: { select: { id: true } },
            },
        });
        await audit(tx, ctx, "USER_CREATED", "User", id);
        return user;
    });
}
