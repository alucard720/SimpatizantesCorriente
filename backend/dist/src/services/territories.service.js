import { z } from "zod";
const territory = z.object({
    name: z.string().trim().min(2).max(100),
    code: z.string().regex(/^\d{2}$/),
    identifier: z.string().regex(/^\d+$/).max(20),
    regionCode: z.string().regex(/^\d{2}$/),
});
const provinceSchema = territory.refine(p => p.identifier === p.regionCode + p.code);
const municipalitySchema = territory.extend({
    provinceCode: z.string().regex(/^\d{2}$/),
}).refine(m => m.identifier === m.regionCode + m.provinceCode + m.code);
const baseUrl = "https://api.digital.gob.do/v1/territories";
export async function fetchTerritories(fetcher = fetch) {
    async function get(path) {
        const response = await fetcher(`${baseUrl}/${path}`, {
            headers: { Accept: "application/json" },
            signal: AbortSignal.timeout(20_000),
        });
        if (!response.ok)
            throw new Error(`API territorial: HTTP ${response.status}`);
        return response.json();
    }
    const provinces = z.object({ valid: z.literal(true), data: z.array(provinceSchema).length(32) })
        .parse(await get("provinces")).data;
    const municipalities = [];
    for (const province of provinces) {
        // La consulta sin filtro está limitada a 100 resultados.
        const rows = z.object({ valid: z.literal(true), data: z.union([z.array(municipalitySchema).min(1).max(99), municipalitySchema]).transform(value => Array.isArray(value) ? value : [value]) })
            .parse(await get(`municipalities?provinceCode=${province.code}`)).data;
        if (rows.some(m => m.provinceCode !== province.code || m.regionCode !== province.regionCode)) {
            throw new Error(`Municipio fuera de la provincia ${province.code}`);
        }
        municipalities.push(...rows);
    }
    if (new Set(provinces.map(p => p.code)).size !== provinces.length ||
        new Set(municipalities.map(m => m.identifier)).size !== municipalities.length) {
        throw new Error("El catálogo territorial contiene códigos duplicados");
    }
    return { provinces, municipalities };
}
export async function syncTerritories(db, catalog) {
    return db.$transaction(async (tx) => {
        const provinceIds = new Map();
        for (const p of catalog.provinces) {
            const matches = await tx.province.findMany({ where: { OR: [{ code: p.code }, { name: p.name }] } });
            if (matches.length > 1)
                throw new Error(`Conflicto de provincia: ${p.name}`);
            const existing = matches[0];
            const province = existing
                ? await tx.province.update({ where: { id: existing.id }, data: { code: p.code, name: p.name } })
                : await tx.province.create({ data: { code: p.code, name: p.name } });
            provinceIds.set(p.code, province.id);
        }
        for (const m of catalog.municipalities) {
            const provinceId = provinceIds.get(m.provinceCode);
            // code se repite entre provincias; identifier es el identificador global.
            const matches = await tx.municipality.findMany({ where: { OR: [
                        { code: m.identifier }, { provinceId, name: m.name },
                    ] } });
            if (matches.length > 1 || (matches[0] && matches[0].provinceId !== provinceId)) {
                throw new Error(`Conflicto de municipio: ${m.name}`);
            }
            const existing = matches[0];
            const data = { code: m.identifier, name: m.name, provinceId };
            if (existing)
                await tx.municipality.update({ where: { id: existing.id }, data });
            else
                await tx.municipality.create({ data });
        }
        return { provinces: catalog.provinces.length, municipalities: catalog.municipalities.length };
    }, { timeout: 60_000 });
}
