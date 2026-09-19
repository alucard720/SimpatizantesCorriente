import { db } from "../lib/db.js";
import { z } from "zod";
import {
  uuid,
  provinceInput,
  municipalityInput,
  schoolInput,
} from "../validators/index.js";
import { audit, type AuditContext } from "../repositories/audit.repository.js";
export const provinces = () =>
  db.province.findMany({
    where: { active: true },
    select: { id: true, name: true, code: true },
    orderBy: { name: "asc" },
  });
export function municipalities(query: unknown) {
  const { provinceId } = z.object({ provinceId: uuid }).parse(query);
  return db.municipality.findMany({
    where: { provinceId, active: true, province: { active: true } },
    select: { id: true, name: true, code: true },
    orderBy: { name: "asc" },
  });
}
export function schools(query: unknown) {
  const { municipalityId, q } = z
    .object({ municipalityId: uuid, q: z.string().trim().max(100).optional() })
    .parse(query);
  return db.school.findMany({
    where: {
      municipalityId,
      active: true,
      municipality: { active: true, province: { active: true } },
      name: q ? { contains: q, mode: "insensitive" } : undefined,
    },
    select: { id: true, name: true, code: true },
    orderBy: { name: "asc" },
    take: 100,
  });
}
export async function createCatalog(
  kind: "province" | "municipality" | "school",
  raw: unknown,
  ctx: AuditContext,
) {
  return db.$transaction(async (tx) => {
    const result =
      kind === "province"
        ? await tx.province.create({ data: provinceInput.parse(raw) })
        : kind === "municipality"
          ? await tx.municipality.create({ data: municipalityInput.parse(raw) })
          : await tx.school.create({ data: schoolInput.parse(raw) });
    await audit(tx, ctx, "CATALOG_CREATED", kind, result.id);
    return result;
  });
}
