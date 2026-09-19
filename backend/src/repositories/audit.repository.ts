import type { AuditAction, Prisma } from "@prisma/client";
export type AuditContext = { requestId: string; actorId?: string };
export function audit(
  tx: Prisma.TransactionClient,
  ctx: AuditContext,
  action: AuditAction,
  entityType: string,
  entityId?: string,
  reason?: string,
) {
  return tx.auditLog.create({
    data: { ...ctx, action, entityType, entityId, reason },
  });
}
