import test from "node:test";
import assert from "node:assert/strict";
import { fetchTerritories } from "../src/services/territories.service.js";
const provinces = Array.from({ length: 32 }, (_, i) => {
  const code = String(i + 1).padStart(2, "0");
  return { code, name: `Provincia ${code}`, regionCode: "01", identifier: `01${code}` };
});
function fixture(invalid = false) {
  const calls: string[] = [];
  const fetcher = (async (input: string | URL | Request) => {
    const url = new URL(String(input));
    calls.push(url.href);
    const code = url.searchParams.get("provinceCode");
    const data = code ? [{
      name: `Municipio ${code}`, code: "01", regionCode: "01",
      provinceCode: invalid ? "99" : code, identifier: `01${invalid ? "99" : code}01`,
    }] : provinces;
    return new Response(JSON.stringify({ valid: true, data: code === "01" ? data[0] : data }));
  }) as typeof fetch;
  return { fetcher, calls };
}
test("consulta todos los municipios por provincia y conserva identificadores únicos", async () => {
  const { fetcher, calls } = fixture();
  const result = await fetchTerritories(fetcher);
  assert.equal(calls.length, 33);
  assert.equal(result.municipalities.length, 32);
  assert.equal(new Set(result.municipalities.map(m => m.identifier)).size, 32);
  assert.equal(result.provinces[0]?.code, "01");
  assert.ok(calls.slice(1).every(url => url.includes("provinceCode=")));
});
test("rechaza municipios de otra provincia", async () => {
  await assert.rejects(fetchTerritories(fixture(true).fetcher), /fuera de la provincia/);
});
test("rechaza errores HTTP y respuestas incompletas", async () => {
  await assert.rejects(fetchTerritories((async () => new Response("", { status: 503 })) as typeof fetch), /HTTP 503/);
  await assert.rejects(fetchTerritories((async () => new Response(JSON.stringify({ valid: true, data: [] }))) as typeof fetch));
});
