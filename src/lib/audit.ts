// Phase 2: Outside MVP Phase 1 scope. Keep for Phase 2 implementation.
// See /issues/PHASE2_SCOPE.md
import type { AuditLogAction, Prisma } from '@prisma/client';
import { logger } from './logger';
import { prisma } from './prisma';

export async function logAudit(data: {
  userId: string;
  action: AuditLogAction;
  targetId?: string;
  targetType?: string;
  metadata?: Record<string, string>;
}) {
  try {
    const createData: Prisma.AuditLogUncheckedCreateInput = {
      userId: data.userId,
      action: data.action,
      targetId: data.targetId,
      targetType: data.targetType,
      metadata: data.metadata as Prisma.InputJsonValue,
    };
    await prisma.auditLog.create({ data: createData });
  } catch (err) {
    logger.warn('Audit log write failed', { error: (err as Error).message, action: data.action });
  }
}
