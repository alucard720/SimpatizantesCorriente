import { randomUUID } from "node:crypto";
import { z } from "zod";
import { env } from "../src/config/env.js";
import { db } from "../src/lib/db.js";
import { hashPassword, verifyPassword } from "../src/lib/crypto.js";
import { audit } from "../src/repositories/audit.repository.js";
try {
    if (env.NODE_ENV !== "development")
        throw new Error("Este comando está permitido solo en desarrollo.");
    const email = z.string().email().parse(process.env.DEV_ADMIN_EMAIL).toLowerCase();
    const password = z.string().min(12).max(128).parse(process.env.DEV_ADMIN_PASSWORD);
    const passwordHash = await hashPassword(password);
    await db.$transaction(async (tx) => {
        const role = await tx.role.findUniqueOrThrow({ where: { code: "ADMIN" } });
        if (!role.active)
            throw new Error("El rol ADMIN está inactivo.");
        const previous = await tx.user.findUnique({ where: { email } });
        if (previous && previous.roleId !== role.id)
            throw new Error("El correo pertenece a otro rol.");
        const data = { passwordHash, active: true, failedAttempts: 0, lockedUntil: null };
        const user = previous
            ? await tx.user.update({ where: { id: previous.id }, data })
            : await tx.user.create({ data: { ...data, email, firstName: "Administrador", lastName: "Desarrollo", roleId: role.id } });
        await tx.session.deleteMany({ where: { userId: user.id } });
        await audit(tx, { requestId: randomUUID() }, previous ? "USER_UPDATED" : "USER_CREATED", "User", user.id, "Administrador configurado explícitamente mediante comando local de desarrollo.");
    });
    const user = await db.user.findUniqueOrThrow({ where: { email } });
    if (!await verifyPassword(password, user.passwordHash))
        throw new Error("Falló la verificación de contraseña.");
    console.log("Administrador de desarrollo configurado y verificado:", email);
}
catch (error) {
    console.error(error instanceof z.ZodError ? "Revise DEV_ADMIN_EMAIL y DEV_ADMIN_PASSWORD en backend/.env." : error instanceof Error ? error.message : "No se pudo configurar el administrador.");
    process.exitCode = 1;
}
finally {
    await db.$disconnect();
}
