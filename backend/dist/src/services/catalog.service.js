import { randomUUID } from "node:crypto";
import { db } from "../lib/db.js";
import { z } from "zod";
import { uuid, provinceInput, seccionalInput, schoolInput, } from "../validators/index.js";
import { audit } from "../repositories/audit.repository.js";
export const provinces = () => db.province.findMany({
    where: { active: true },
    select: { id: true, name: true, code: true },
    orderBy: { name: "asc" },
});
export function seccionales(query) {
    const { provinceId } = z.object({ provinceId: uuid }).parse(query);
    return db.seccional.findMany({
        where: { provinceId, active: true, number: { not: null }, province: { active: true } },
        select: { id: true, name: true, code: true, number: true },
        orderBy: { number: "asc" },
    });
}
export function schools(query) {
    const { seccionalId, q } = z
        .object({ seccionalId: uuid, q: z.string().trim().max(100).optional() })
        .parse(query);
    return db.school.findMany({
        where: {
            seccionalId,
            active: true,
            seccional: { active: true, number: { not: null }, province: { active: true } },
            name: q ? { contains: q, mode: "insensitive" } : undefined,
        },
        select: { id: true, name: true, code: true },
        orderBy: { name: "asc" },
        take: 100,
    });
}
export async function createCatalog(kind, raw, ctx) {
    return db.$transaction(async (tx) => {
        const result = kind === "province"
            ? await tx.province.create({ data: provinceInput.parse(raw) })
            : kind === "seccional"
                ? await tx.seccional.create({ data: { ...seccionalInput.parse(raw), code: randomUUID().slice(0, 20) } })
                : await tx.school.create({ data: schoolInput.parse(raw) });
        await audit(tx, ctx, "CATALOG_CREATED", kind, result.id);
        return result;
    });
}
