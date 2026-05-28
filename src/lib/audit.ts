import type { AuditLogAction, Prisma } from '@prisma/client';
import { prisma } from './prisma';

export async function logAudit(data: {
  userId: string;
  action: AuditLogAction;
  targetId?: string;
  targetType?: string;
  metadata?: Record<string, string>;
}) {
  const createData: Prisma.AuditLogUncheckedCreateInput = {
    userId: data.userId,
    action: data.action,
    targetId: data.targetId,
    targetType: data.targetType,
    metadata: data.metadata as Prisma.InputJsonValue,
  };
  await prisma.auditLog.create({ data: createData });
}
