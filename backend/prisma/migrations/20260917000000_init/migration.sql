-- CreateEnum
CREATE TYPE "RoleCode" AS ENUM ('ADMIN', 'LEADER');

-- CreateEnum
CREATE TYPE "RegistrationStatus" AS ENUM ('PENDING', 'VERIFIED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "RegistrationSource" AS ENUM ('PUBLIC_FORM');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('LOGIN_SUCCESS', 'LOGIN_FAILURE', 'LOGOUT', 'REGISTRATION_CREATED', 'REGISTRATION_LISTED', 'REGISTRATION_UPDATED', 'SENSITIVE_DATA_READ', 'USER_CREATED', 'USER_UPDATED', 'LEADER_ASSIGNED', 'CATALOG_CREATED', 'DASHBOARD_READ', 'AUDIT_READ');

-- CreateTable
CREATE TABLE "roles" (
    "id" UUID NOT NULL,
    "code" "RoleCode" NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" VARCHAR(250),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(254) NOT NULL,
    "phone_encrypted" TEXT,
    "password_hash" VARCHAR(255) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "failed_attempts" INTEGER NOT NULL DEFAULT 0,
    "locked_until" TIMESTAMPTZ(3),
    "last_login_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "leader_id" UUID,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provinces" (
    "id" UUID NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "provinces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "municipalities" (
    "id" UUID NOT NULL,
    "province_id" UUID NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "municipalities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schools" (
    "id" UUID NOT NULL,
    "municipality_id" UUID NOT NULL,
    "code" VARCHAR(30),
    "name" VARCHAR(200) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "schools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leaders" (
    "id" UUID NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "leaders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leader_municipalities" (
    "leader_id" UUID NOT NULL,
    "municipality_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "leader_municipalities_pkey" PRIMARY KEY ("leader_id","municipality_id")
);

-- CreateTable
CREATE TABLE "registrations" (
    "id" UUID NOT NULL,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "cedula_encrypted" TEXT NOT NULL,
    "cedula_hmac" CHAR(64) NOT NULL,
    "phone_encrypted" TEXT NOT NULL,
    "municipality_id" UUID NOT NULL,
    "school_id" UUID,
    "school_name" VARCHAR(200),
    "status" "RegistrationStatus" NOT NULL DEFAULT 'PENDING',
    "source" "RegistrationSource" NOT NULL DEFAULT 'PUBLIC_FORM',
    "consent_version" VARCHAR(40) NOT NULL,
    "consent_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "registrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "actor_id" UUID,
    "action" "AuditAction" NOT NULL,
    "entity_type" VARCHAR(50) NOT NULL,
    "entity_id" UUID,
    "request_id" UUID NOT NULL,
    "reason" VARCHAR(300),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" UUID NOT NULL,
    "token_hash" CHAR(64) NOT NULL,
    "user_id" UUID NOT NULL,
    "expires_at" TIMESTAMPTZ(3) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "roles_code_key" ON "roles"("code");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_id_active_idx" ON "users"("role_id", "active");

-- CreateIndex
CREATE INDEX "users_leader_id_active_idx" ON "users"("leader_id", "active");

-- CreateIndex
CREATE UNIQUE INDEX "provinces_code_key" ON "provinces"("code");

-- CreateIndex
CREATE UNIQUE INDEX "provinces_name_key" ON "provinces"("name");

-- CreateIndex
CREATE UNIQUE INDEX "municipalities_code_key" ON "municipalities"("code");

-- CreateIndex
CREATE INDEX "municipalities_province_id_active_idx" ON "municipalities"("province_id", "active");

-- CreateIndex
CREATE UNIQUE INDEX "municipalities_province_id_name_key" ON "municipalities"("province_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "schools_code_key" ON "schools"("code");

-- CreateIndex
CREATE INDEX "schools_municipality_id_active_idx" ON "schools"("municipality_id", "active");

-- CreateIndex
CREATE UNIQUE INDEX "schools_id_municipality_id_key" ON "schools"("id", "municipality_id");

-- CreateIndex
CREATE UNIQUE INDEX "schools_municipality_id_name_key" ON "schools"("municipality_id", "name");

-- CreateIndex
CREATE INDEX "leader_municipalities_municipality_id_idx" ON "leader_municipalities"("municipality_id");

-- CreateIndex
CREATE UNIQUE INDEX "registrations_cedula_hmac_key" ON "registrations"("cedula_hmac");

-- CreateIndex
CREATE INDEX "registrations_municipality_id_status_created_at_idx" ON "registrations"("municipality_id", "status", "created_at");

-- CreateIndex
CREATE INDEX "registrations_school_id_municipality_id_idx" ON "registrations"("school_id", "municipality_id");

-- CreateIndex
CREATE INDEX "registrations_created_at_id_idx" ON "registrations"("created_at", "id");

-- CreateIndex
CREATE INDEX "audit_logs_actor_id_created_at_idx" ON "audit_logs"("actor_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_created_at_idx" ON "audit_logs"("entity_type", "entity_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_action_created_at_idx" ON "audit_logs"("action", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_hash_key" ON "sessions"("token_hash");

-- CreateIndex
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");

-- CreateIndex
CREATE INDEX "sessions_expires_at_idx" ON "sessions"("expires_at");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_leader_id_fkey" FOREIGN KEY ("leader_id") REFERENCES "leaders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "municipalities" ADD CONSTRAINT "municipalities_province_id_fkey" FOREIGN KEY ("province_id") REFERENCES "provinces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schools" ADD CONSTRAINT "schools_municipality_id_fkey" FOREIGN KEY ("municipality_id") REFERENCES "municipalities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leader_municipalities" ADD CONSTRAINT "leader_municipalities_leader_id_fkey" FOREIGN KEY ("leader_id") REFERENCES "leaders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leader_municipalities" ADD CONSTRAINT "leader_municipalities_municipality_id_fkey" FOREIGN KEY ("municipality_id") REFERENCES "municipalities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_municipality_id_fkey" FOREIGN KEY ("municipality_id") REFERENCES "municipalities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_school_id_municipality_id_fkey" FOREIGN KEY ("school_id", "municipality_id") REFERENCES "schools"("id", "municipality_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Invariantes que Prisma no representa como atributos del esquema.
ALTER TABLE users ADD CONSTRAINT users_email_normalized CHECK (email = lower(btrim(email)));
ALTER TABLE users ADD CONSTRAINT users_failed_attempts_nonnegative CHECK (failed_attempts >= 0);
ALTER TABLE users ADD CONSTRAINT users_names_nonempty CHECK (length(btrim(first_name)) > 0 AND length(btrim(last_name)) > 0);
ALTER TABLE leaders ADD CONSTRAINT leaders_name_nonempty CHECK (length(btrim(name)) > 0);
ALTER TABLE registrations ADD CONSTRAINT registrations_names_nonempty CHECK (length(btrim(first_name)) > 0 AND length(btrim(last_name)) > 0);
ALTER TABLE registrations ADD CONSTRAINT registrations_consent_version CHECK (length(btrim(consent_version)) > 0);
ALTER TABLE registrations ADD CONSTRAINT registrations_hmac_format CHECK (cedula_hmac ~ '^[0-9a-f]{64}$');
ALTER TABLE registrations ADD CONSTRAINT registrations_school_exclusive CHECK (school_id IS NULL OR school_name IS NULL);
ALTER TABLE registrations ADD CONSTRAINT registrations_school_text CHECK (school_name IS NULL OR length(btrim(school_name)) >= 2);

CREATE FUNCTION enforce_user_leader_role() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE role_code "RoleCode";
BEGIN
  SELECT code INTO role_code FROM roles WHERE id = NEW.role_id;
  IF (role_code = 'LEADER' AND NEW.leader_id IS NULL) OR (role_code = 'ADMIN' AND NEW.leader_id IS NOT NULL) THEN
    RAISE EXCEPTION 'Invalid user role / leader relationship' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER users_leader_role BEFORE INSERT OR UPDATE OF role_id, leader_id ON users
FOR EACH ROW EXECUTE FUNCTION enforce_user_leader_role();

CREATE FUNCTION prevent_role_code_change() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.code IS DISTINCT FROM OLD.code THEN
    RAISE EXCEPTION 'Role codes are immutable' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER roles_immutable_code BEFORE UPDATE OF code ON roles FOR EACH ROW EXECUTE FUNCTION prevent_role_code_change();

CREATE FUNCTION protect_audit_logs() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'Audit logs are append-only' USING ERRCODE = '23514';
END;
$$;
CREATE TRIGGER audit_logs_no_update_delete BEFORE UPDATE OR DELETE ON audit_logs FOR EACH ROW EXECUTE FUNCTION protect_audit_logs();
CREATE TRIGGER audit_logs_no_truncate BEFORE TRUNCATE ON audit_logs FOR EACH STATEMENT EXECUTE FUNCTION protect_audit_logs();

INSERT INTO roles (id, code, name, active, created_at, updated_at) VALUES
('00000000-0000-4000-8000-000000000001', 'ADMIN', 'Administrador', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('00000000-0000-4000-8000-000000000002', 'LEADER', 'Líder', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (code) DO NOTHING;
