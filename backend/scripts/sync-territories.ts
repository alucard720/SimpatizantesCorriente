import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { fetchTerritories, syncTerritories } from "../src/services/territories.service.js";

const db = new PrismaClient();
try {
  const catalog = await fetchTerritories();
  const counts = await syncTerritories(db, catalog);
  console.log(`Catálogo oficial sincronizado: ${counts.provinces} provincias y ${counts.municipalities} municipios.`);
} catch (error) {
  console.error(error instanceof Error ? error.message : "No se pudo sincronizar el catálogo");
  process.exitCode = 1;
} finally {
  await db.$disconnect();
}
