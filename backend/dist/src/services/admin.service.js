import { z } from "zod";
import { db } from "../lib/db.js";
import { HttpError } from "../lib/errors.js";
import { uuid, assignmentInput, pageInput } from "../validators/index.js";
import { audit } from "../repositories/audit.repository.js";
export function listUsers(raw) {
    const q = pageInput.parse(raw);
    return db.user.findMany({
        select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            active: true,
            role: { select: { code: true } },
            leader: {
                select: {
                    id: true,
                    municipalities: { select: { municipalityId: true } },
                },
            },
        },
        orderBy: { id: "asc" },
        take: q.pageSize,
        skip: (q.page - 1) * q.pageSize,
    });
}
export async function assignMunicipalities(idRaw, raw, ctx) {
    const id = uuid.parse(idRaw);
    const { municipalityIds } = assignmentInput.parse(raw);
    return db.$transaction(async (tx) => {
        await tx.$queryRaw `SELECT id FROM leaders WHERE id = ${id}::uuid FOR UPDATE`;
        const leader = await tx.leader.findUnique({
            where: { id },
            include: { users: { select: { id: true } } },
        });
        if (!leader || !leader.active)
            throw new HttpError(404, "Líder no encontrado");
        if ((await tx.municipality.count({
            where: {
                id: { in: municipalityIds },
                active: true,
                province: { active: true },
            },
        })) !== municipalityIds.length)
            throw new HttpError(400, "Municipios inválidos");
        await tx.leaderMunicipality.deleteMany({ where: { leaderId: id } });
        await tx.leaderMunicipality.createMany({
            data: municipalityIds.map((municipalityId) => ({
                leaderId: id,
                municipalityId,
            })),
        });
        await audit(tx, ctx, "LEADER_ASSIGNED", "Leader", id);
        return { id, municipalityIds };
    });
}
export async function setUserActive(idRaw, raw, ctx) {
    const id = uuid.parse(idRaw);
    const { active } = z.object({ active: z.boolean() }).strict().parse(raw);
    if (id === ctx.actorId && !active)
        throw new HttpError(400, "No puede desactivar su propio acceso");
    return db.$transaction(async (tx) => {
        await tx.user.update({ where: { id }, data: { active } });
        if (!active)
            await tx.session.deleteMany({ where: { userId: id } });
        await audit(tx, ctx, "USER_UPDATED", "User", id, active ? "Activado" : "Desactivado");
        return { id, active };
    });
}
export async function auditLogs(raw, ctx) {
    const q = pageInput.parse(raw);
    return db.$transaction(async (tx) => {
        await audit(tx, ctx, "AUDIT_READ", "AuditLog");
        return tx.auditLog.findMany({
            orderBy: [{ createdAt: "desc" }, { id: "desc" }],
            skip: (q.page - 1) * q.pageSize,
            take: q.pageSize,
        });
    });
}
export async function createLeader(raw, ctx) {
    const data = z
        .object({ name: z.string().trim().min(2).max(150) })
        .strict()
        .parse(raw);
    return db.$transaction(async (tx) => {
        const leader = await tx.leader.create({ data });
        await audit(tx, ctx, "LEADER_ASSIGNED", "Leader", leader.id, "Perfil de líder creado");
        return leader;
    });
}
export function listLeaders(raw) {
    const q = pageInput.parse(raw);
    return db.leader.findMany({
        select: {
            id: true,
            name: true,
            active: true,
            municipalities: {
                select: {
                    municipalityId: true,
                    municipality: { select: { name: true } },
                },
            },
            _count: { select: { users: true } },
        },
        orderBy: { name: "asc" },
        take: q.pageSize,
        skip: (q.page - 1) * q.pageSize,
    });
}
