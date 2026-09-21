import test from "node:test";
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import request from "supertest";
import "dotenv/config";
const database = process.env.TEST_DATABASE_URL;
if (!database || !(new URL(database).pathname.endsWith("_test") || /^codex_[a-z0-9_]+_test$/.test(new URL(database).searchParams.get("schema") ?? "")))
  throw new Error(
    "TEST_DATABASE_URL debe apuntar a una base _test o a un esquema desechable codex_*_test",
  );
Object.assign(process.env, {
  NODE_ENV: "test",
  DATABASE_URL: database,
  FRONTEND_ORIGIN: "http://localhost:5173",
  DATA_ENCRYPTION_KEY: randomBytes(32).toString("base64"),
  CEDULA_HMAC_KEY: randomBytes(32).toString("base64"),
  PRIVACY_CONTROLLER: "Pruebas sintéticas",
  PRIVACY_CONTACT: "Pruebas",
  PRIVACY_RETENTION: "Pruebas",
  PRIVACY_VERSION: "test-v1",
  CAPTCHA_PROVIDER: "disabled",
});
execFileSync(
  process.execPath,
  ["../node_modules/prisma/build/index.js", "migrate", "deploy"],
  { env: process.env, stdio: "pipe" },
);
const { app } = await import("../src/app.js");
const { db } = await import("../src/lib/db.js");
const { hashPassword } = await import("../src/lib/crypto.js");
const origin = "http://localhost:5173";
const prefix = randomUUID().slice(0, 8),
  password = "synthetic-test-password-123";
test("V1: registro, cifrado, duplicados, varios usuarios por líder, RBAC, CSRF, auditoría y revocación", async () => {
  try {
    const catalog = await request(app).get("/api/public/provinces");
    assert.equal(catalog.status, 200);
    assert.equal(catalog.body.length, 32);
    assert.equal(await db.seccional.count({where:{number:{not:null}}}),174);
    const azua = catalog.body.find((p: {name: string}) => p.name === "AZUA");
    const azuaSections = await request(app).get(`/api/public/seccionales?provinceId=${azua.id}`);
    assert.deepEqual(azuaSections.body.map((s: {number:number})=>s.number), [1,2,3,4,5,6,7,8]);
    assert.equal((await request(app).get("/api/public/municipalities")).status,404);
    const adminRole = await db.role.upsert({
      where: { code: "ADMIN" },
      update: {},
      create: { code: "ADMIN", name: "Administrador" },
    });
    const leaderRole = await db.role.upsert({
      where: { code: "LEADER" },
      update: {},
      create: { code: "LEADER", name: "Líder" },
    });
    const hash = await hashPassword(password);
    const admin = await db.user.create({
      data: {
        roleId: adminRole.id,
        firstName: "TEST",
        lastName: "ADMIN",
        email: `${prefix}-admin@example.invalid`,
        passwordHash: hash,
      },
    });
    const p = await db.province.create({
      data: { code: prefix, name: `TEST Provincia ${prefix}` },
    });
    const m1 = await db.seccional.create({
        data: {
          provinceId: p.id,
          code: prefix + "A",
          number: 1,
          name: "TEST Seccional A",
        },
      }),
      m2 = await db.seccional.create({
        data: {
          provinceId: p.id,
          code: prefix + "B",
          number: 2,
          name: "TEST Seccional B",
        },
      });
    await assert.rejects(db.seccional.create({data:{provinceId:p.id,code:prefix+"duplicate",name:"Duplicate",number:1}}));
    const historical = await db.seccional.create({data:{provinceId:p.id,code:prefix+"legacy",name:"Historical"}});
    const visible = await request(app).get(`/api/public/seccionales?provinceId=${p.id}`);
    assert.equal(visible.body.some((s: {id:string})=>s.id===historical.id),false);
    const school = await db.school.create({
      data: { seccionalId: m2.id, name: "TEST Escuela B" },
    });
    const leader = await db.leader.create({
      data: {
        name: "TEST Líder " + prefix,
        seccionales: { create: { seccionalId: m1.id } },
      },
    });
    const u1 = await db.user.create({
      data: {
        roleId: leaderRole.id,
        leaderId: leader.id,
        firstName: "TEST",
        lastName: "USUARIO A",
        email: `${prefix}-a@example.invalid`,
        passwordHash: hash,
      },
    });
    const u2 = await db.user.create({
      data: {
        roleId: leaderRole.id,
        leaderId: leader.id,
        firstName: "TEST",
        lastName: "USUARIO B",
        email: `${prefix}-b@example.invalid`,
        passwordHash: hash,
      },
    });
    const a = request.agent(app),
      b = request.agent(app),
      c = request.agent(app);
    for (const [agent, email] of [
      [a, admin.email],
      [b, u1.email],
      [c, u2.email],
    ] as const) {
      const response = await agent
        .post("/api/auth/login")
        .set("Origin", origin)
        .send({ email, password });
      assert.equal(response.status, 200);
      assert.match(response.headers["set-cookie"][0], /HttpOnly/);
      assert.match(response.headers["set-cookie"][0], /SameSite=Strict/);
    }
    assert.equal(
      (await request(app).get("/api/private/registrations")).status,
      401,
    );
    assert.equal((await b.get("/api/private/admin/users")).status, 403);
    assert.equal(
      (await a.post("/api/private/admin/leaders").send({ name: "CSRF" }))
        .status,
      403,
    );
    const cedula = "000" + String(Date.now()).slice(-8);
    const body = {
      firstName: "TEST",
      lastName: "REGISTRO SINTÉTICO",
      cedula,
      phone: "0000000000",
      provinceId: p.id,
      seccionalId: m1.id,
      consent: true,
      consentVersion: "test-v1",
    };
    assert.equal(
      (
        await request(app)
          .post("/api/public/registrations")
          .set("Origin", origin)
          .send({ ...body, consent: false })
      ).status,
      400,
    );
    assert.equal(
      (
        await request(app)
          .post("/api/public/registrations")
          .set("Origin", origin)
          .send({ ...body, schoolId: school.id })
      ).status,
      400,
    );
    for (const invalid of [{...body,provinceId:azua.id},{...body,seccionalId:historical.id}]) {
      assert.equal((await request(app).post("/api/public/registrations").set("Origin",origin).send(invalid)).status,400);
    }
    const [first, duplicate] = await Promise.all([
      request(app)
        .post("/api/public/registrations")
        .set("Origin", origin)
        .send(body),
      request(app)
        .post("/api/public/registrations")
        .set("Origin", origin)
        .send(body),
    ]);
    assert.equal(first.status, 202);
    assert.equal(duplicate.status, 202);
    assert.deepEqual(first.body, duplicate.body);
    const record = await db.registration.findFirstOrThrow({
      where: { seccionalId: m1.id },
    });
    assert.equal(
      await db.registration.count({ where: { seccionalId: m1.id } }),
      1,
    );
    assert.notEqual(record.cedulaEncrypted, cedula);
    assert.notEqual(record.phoneEncrypted, body.phone);
    await request(app)
      .post("/api/public/registrations")
      .set("Origin", origin)
      .send({
        ...body,
        cedula: "001" + cedula.slice(3),
        seccionalId: m2.id,
      });
    const other = await db.registration.findFirstOrThrow({
      where: { seccionalId: m2.id },
    });
    for (const agent of [b, c]) {
      const list = await agent.get("/api/private/registrations");
      assert.equal(list.status, 200);
      assert.equal(list.body.total, 1);
      assert.equal(list.body.items[0].id, record.id);
      assert.equal("cedulaEncrypted" in list.body.items[0], false);
      assert.equal("phone" in list.body.items[0], false);
    }
    assert.equal(
      (await b.get(`/api/private/registrations?seccionalId=${m2.id}`)).body
        .total,
      0,
    );
    assert.equal(
      (
        await b
          .patch(`/api/private/registrations/${other.id}/status`)
          .set("Origin", origin)
          .send({ status: "VERIFIED" })
      ).status,
      404,
    );
    assert.equal(
      (
        await b
          .post(`/api/private/registrations/${record.id}/sensitive`)
          .set("Origin", origin)
          .send({ reason: "Prueba autorizada" })
      ).status,
      403,
    );
    const reveal = await a
      .post(`/api/private/registrations/${record.id}/sensitive`)
      .set("Origin", origin)
      .send({ reason: "TEST comprobar cifrado" });
    assert.equal(reveal.status, 200);
    assert.equal(reveal.body.cedula, cedula);
    assert.ok(
      await db.auditLog.findFirst({
        where: {
          actorId: admin.id,
          action: "SENSITIVE_DATA_READ",
          entityId: record.id,
        },
      }),
    );
    assert.equal(
      (
        await b
          .patch(`/api/private/registrations/${record.id}/status`)
          .set("Origin", origin)
          .send({ status: "VERIFIED" })
      ).status,
      200,
    );
    assert.ok(
      await db.auditLog.findFirst({
        where: {
          actorId: u1.id,
          action: "REGISTRATION_UPDATED",
          entityId: record.id,
        },
      }),
    );
    await assert.rejects(
      db.registration.update({
        where: { id: record.id },
        data: { schoolId: school.id },
      }),
    );
    await assert.rejects(
      db.user.create({
        data: {
          roleId: leaderRole.id,
          firstName: "TEST",
          lastName: "INVALID",
          email: `${prefix}-invalid@example.invalid`,
          passwordHash: hash,
        },
      }),
    );
    const log = await db.auditLog.findFirstOrThrow({
      where: { entityId: record.id },
    });
    await assert.rejects(db.auditLog.delete({ where: { id: log.id } }));
    assert.equal(
      (
        await a
          .put(`/api/private/admin/leaders/${leader.id}/seccionales`)
          .set("Origin", origin)
          .send({ seccionalIds: [m2.id] })
      ).status,
      200,
    );
    for (const agent of [b, c]) {
      const list = await agent.get("/api/private/registrations");
      assert.equal(list.body.total, 1);
      assert.equal(list.body.items[0].id, other.id);
    }
    assert.equal(
      (
        await a
          .patch(`/api/private/admin/users/${u1.id}`)
          .set("Origin", origin)
          .send({ active: false })
      ).status,
      200,
    );
    assert.equal((await b.get("/api/auth/me")).status, 401);
    assert.equal((await c.get("/api/auth/me")).status, 200);
    assert.equal(
      (await c.post("/api/auth/logout").set("Origin", origin)).status,
      204,
    );
    assert.equal((await c.get("/api/auth/me")).status, 401);
    for (let i = 0; i < 5; i++)
      assert.equal(
        (
          await request(app)
            .post("/api/auth/login")
            .set("Origin", origin)
            .send({ email: u2.email, password: "incorrecta" })
        ).status,
        401,
      );
    assert.equal(
      (
        await request(app)
          .post("/api/auth/login")
          .set("Origin", origin)
          .send({ email: u2.email, password })
      ).status,
      401,
    );
    assert.ok(
      (await db.user.findUniqueOrThrow({ where: { id: u2.id } })).lockedUntil,
    );
    for (let i = 0; i < 6; i++)
      await request(app)
        .post("/api/auth/login")
        .set("Origin", origin)
        .send({ email: u2.email, password: "incorrecta" });
    assert.equal(
      (
        await request(app)
          .post("/api/auth/login")
          .set("Origin", origin)
          .send({ email: u2.email, password: "incorrecta" })
      ).status,
      429,
    );
  } finally {
    await db.$disconnect();
  }
});
