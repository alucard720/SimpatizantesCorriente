export function audit(tx, ctx, action, entityType, entityId, reason) {
    return tx.auditLog.create({
        data: { ...ctx, action, entityType, entityId, reason },
    });
}
