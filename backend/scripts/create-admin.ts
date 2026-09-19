import { randomUUID } from "node:crypto";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { createUser } from "../src/services/auth.service.js";
import { db } from "../src/lib/db.js";
// Contraseña por entrada oculta; nunca por argumentos de shell ni en el repositorio.
async function secret(): Promise<string> {
  if (!stdin.isTTY) throw new Error("Ejecute desde una terminal interactiva");
  stdout.write("Contraseña (mínimo 12 caracteres): ");
  stdin.setRawMode(true);
  stdin.resume();
  return new Promise((resolve, reject) => {
    let value = "";
    const finish = () => {
      stdin.setRawMode(false);
      stdin.off("data", onData);
      stdin.pause();
      stdout.write("\n");
    };
    const onData = (chunk: Buffer) => {
      for (const char of chunk.toString()) {
        if (char === "\u0003") {
          finish();
          reject(new Error("Cancelado"));
          return;
        }
        if (char === "\r" || char === "\n") {
          finish();
          resolve(value);
          return;
        }
        if (char === "\u007f") value = value.slice(0, -1);
        else if (char >= " ") value += char;
      }
    };
    stdin.on("data", onData);
  });
}
try {
  const rl = createInterface({ input: stdin, output: stdout });
  const firstName = await rl.question("Nombre: "),
    lastName = await rl.question("Apellido: "),
    email = await rl.question("Email: ");
  rl.close();
  const password = await secret();
  const result = await createUser(
    { firstName, lastName, email, password, role: "ADMIN" },
    { requestId: randomUUID() },
  );
  console.log("Administrador creado:", result.id);
} catch {
  console.error(
    "No se creó el administrador. Revise campos, roles y conexión.",
  );
  process.exitCode = 1;
} finally {
  await db.$disconnect();
}
