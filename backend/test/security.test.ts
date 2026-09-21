import test from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
Object.assign(process.env, {
  NODE_ENV: "test",
  DATABASE_URL: "postgresql://test:test@localhost:5432/corriente_test",
  FRONTEND_ORIGIN: "http://localhost:5173",
  DATA_ENCRYPTION_KEY: randomBytes(32).toString("base64"),
  CEDULA_HMAC_KEY: randomBytes(32).toString("base64"),
  PRIVACY_CONTROLLER: "Pruebas",
  PRIVACY_CONTACT: "Pruebas",
  PRIVACY_RETENTION: "Pruebas",
  CAPTCHA_PROVIDER: "disabled",
});
const { encrypt, decrypt, cedulaDigest, hashPassword, verifyPassword } =
  await import("../src/lib/crypto.js");
const { registrationInput, userInput } = await import(
  "../src/validators/index.js"
);
const { registrationScope } = await import(
  "../src/repositories/registration.repository.js"
);
test("AES-GCM aleatorio, recuperable y vinculado a campo/registro", () => {
  const a = encrypt("dato-sintetico", "record:one:phone"),
    b = encrypt("dato-sintetico", "record:one:phone");
  assert.notEqual(a, b);
  assert.equal(decrypt(a, "record:one:phone"), "dato-sintetico");
  assert.throws(() => decrypt(a, "record:two:phone"));
  const pieces = a.split(".");
  const bytes = Buffer.from(pieces[3]!, "base64");
  bytes[0] = bytes[0]! ^ 1;
  pieces[3] = bytes.toString("base64");
  assert.throws(() => decrypt(pieces.join("."), "record:one:phone"));
});
test("HMAC normaliza cédula sin exponer su valor", () => {
  assert.equal(cedulaDigest("000-0000000-1"), cedulaDigest("00000000001"));
  assert.notEqual(cedulaDigest("00000000001"), cedulaDigest("00000000002"));
  assert.match(cedulaDigest("00000000001"), /^[a-f0-9]{64}$/);
});
test("scrypt verifica contraseñas y usa sales únicas", async () => {
  const a = await hashPassword("sintetica-segura-123"),
    b = await hashPassword("sintetica-segura-123");
  assert.notEqual(a, b);
  assert.ok(await verifyPassword("sintetica-segura-123", a));
  assert.equal(await verifyPassword("incorrecta", a), false);
});
test("consentimiento y relación usuario-líder obligatorios", () => {
  assert.equal(registrationInput.safeParse({ consent: false }).success, false);
  const user = {
    firstName: "Prueba",
    lastName: "Sintética",
    email: "synthetic@example.invalid",
    password: "synthetic-long-password",
    role: "LEADER",
  };
  assert.equal(userInput.safeParse(user).success, false);
  assert.equal(
    userInput.safeParse({
      ...user,
      leaderId: "00000000-0000-4000-8000-000000000001",
    }).success,
    true,
  );
  assert.equal(
    userInput.safeParse({
      ...user,
      role: "ADMIN",
      leaderId: "00000000-0000-4000-8000-000000000001",
    }).success,
    false,
  );
});
test("el ámbito sin autenticación o sin seccionales falla cerrado", () => {
  assert.deepEqual(registrationScope(undefined), { id: { in: [] } });
  assert.deepEqual(
    registrationScope({
      userId: "u",
      role: "LEADER",
      seccionalIds: [],
      sessionId: "s",
    }),
    { seccionalId: { in: [] } },
  );
});
