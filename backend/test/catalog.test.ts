import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { seccionalInput } from "../src/validators/index.js";

test("el SQL conserva 174 seccionales y números únicos dentro de 32 provincias", () => {
 const sql = readFileSync(new URL("../prisma/migrations/20260921000000_local_seccionales/migration.sql", import.meta.url), "utf8");
 const rows = [...sql.matchAll(/^    \('([^']+)', (\d+), '([^']+)'\)/gm)];
 assert.equal(rows.length,174);
 assert.equal(new Set(rows.map(row => row[1])).size,32);
 assert.equal(new Set(rows.map(row => `${row[1]}:${row[2]}`)).size,174);
 assert.deepEqual(rows.filter(row => row[1] === "SANTIAGO").map(row => Number(row[2])), Array.from({length:14},(_,i)=>i+1));
});
test("la creación de seccionales exige provincia, nombre y número entero positivo", () => {
 const base={provinceId:"00000000-0000-4000-8000-000000000001",name:"Seccional"};
 for (const number of [undefined,0,-1,1.2]) assert.equal(seccionalInput.safeParse({...base,number}).success,false);
 assert.equal(seccionalInput.parse({...base,number:"2"}).number,2);
});
