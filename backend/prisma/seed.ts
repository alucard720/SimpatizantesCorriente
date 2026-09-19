import "dotenv/config";
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
try {
  for (const [code, name] of [
    ["ADMIN", "Administrador"],
    ["LEADER", "Líder"],
  ] as const)
    await db.role.upsert({
      where: { code },
      update: { name },
      create: { code, name },
    });
  console.log(
    "Roles ADMIN y LEADER listos. No se crearon personas ni catálogos.",
  );
} finally {
  await db.$disconnect();
}
