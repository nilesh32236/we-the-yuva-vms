import { type Prisma, type User, UserStatus } from '@prisma/client';
import type { AdminUserUpdateInput } from '@/shared';
import { logAudit } from '../../lib/audit';
import { sendEmail } from '../../lib/email';
import { logger } from '../../lib/logger';
import { prisma } from '../../lib/prisma';
import { notificationsQueue } from '../../lib/queue';
import { AppError } from '../../middleware/error.middleware';

interface ListUsersFilters {
  role?: string;
  status?: string;
  search?: string;
}

interface Pagination {
  page: number;
  limit: number;
}

export async function createUser(
  adminId: string,
  data: {
    name: string;
    email: string;
    role: string;
    locationName?: string;
  }
) {
  let locationId: string | undefined;
  if (data.locationName) {
    const loc = await prisma.location.upsert({
      where: { id: `loc-${data.locationName.toLowerCase().replace(/\s+/g, '-')}` },
      update: {},
      create: {
        id: `loc-${data.locationName.toLowerCase().replace(/\s+/g, '-')}`,
        name: data.locationName,
      },
    });
    locationId = loc.id;
  }

  const roleRecord = await prisma.role.findUnique({ where: { name: data.role } });
  if (!roleRecord) {
    throw new AppError(`Invalid role: ${data.role}`, 400);
  }

  let user: User;
  try {
    user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        roleId: roleRecord.id,
        status: 'ACTIVE',
        locationId,
        consent: { create: { privacyPolicyAccepted: true, mediaConsentAccepted: false } },
        ...(data.role === 'VOLUNTEER' && {
          profile: {
            create: { skills: [], interests: [], availability: { days: [], timeSlots: [] } },
          },
        }),
      },
    });
  } catch (err: unknown) {
    if ((err as { code?: string })?.code === 'P2002') {
      throw new AppError('Email already registered', 409);
    }
    throw err;
  }

  logAudit({
    userId: adminId,
    action: 'USER_CREATE',
    targetId: user.id,
    targetType: 'User',
    metadata: { role: data.role },
  }).catch((err) => logger.warn('Audit log failed', { error: (err as Error).message }));

  return user;
}

export async function listUsers(filters: ListUsersFilters, pagination: Pagination) {
  const { role, status, search } = filters;
  const { page, limit } = pagination;
  const skip = (page - 1) * limit;

  // Build where clause
  const where: Prisma.UserWhereInput = {};
  if (role) where.roleRef = { name: role };
  if (status) where.status = status as UserStatus;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        volunteerType: true,
        createdAt: true,
        roleRef: { select: { name: true } },
        profile: { select: { totalHours: true } },
        location: { select: { name: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function updateUser(id: string, data: AdminUserUpdateInput, adminId?: string) {
  // Verify user exists
  const existing = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      roleId: true,
      status: true,
      email: true,
      roleRef: { select: { name: true } },
    },
  });
  if (!existing) {
    throw new AppError('User not found', 404);
  }

  let updateRoleId: string | undefined;
  if (data.role) {
    const roleRecord = await prisma.role.findUnique({ where: { name: data.role } });
    if (!roleRecord) {
      throw new AppError(`Invalid role: ${data.role}`, 400);
    }
    updateRoleId = roleRecord.id;
  }

  const user = await prisma.$transaction(async (tx) => {
    const updatedUser = await tx.user.update({
      where: { id },
      data: {
        ...(data.status && { status: data.status }),
        ...(updateRoleId && { roleId: updateRoleId }),
      },
      select: { id: true, name: true, email: true, status: true },
    });

    if (data.status === 'SUSPENDED') {
      await tx.refreshToken.updateMany({
        where: { userId: id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }

    return updatedUser;
  });

  if (adminId) {
    const changes: Record<string, string> = {};
    if (data.status && data.status !== existing.status)
      changes.status = `${existing.status} → ${data.status}`;
    if (data.role && existing.roleRef && data.role !== existing.roleRef.name)
      changes.role = `${existing.roleRef.name} → ${data.role}`;

    if (data.status === 'SUSPENDED' && existing.status !== 'SUSPENDED') {
      logAudit({
        userId: adminId,
        action: 'USER_SUSPEND',
        targetId: id,
        targetType: 'User',
        metadata: changes,
      }).catch((err) => logger.warn('Audit log failed', { error: (err as Error).message }));
    } else if (data.role && existing.roleRef && data.role !== existing.roleRef.name) {
      logAudit({
        userId: adminId,
        action: 'USER_CHANGE_ROLE',
        targetId: id,
        targetType: 'User',
        metadata: changes,
      }).catch((err) => logger.warn('Audit log failed', { error: (err as Error).message }));
    } else if (Object.keys(changes).length > 0) {
      logAudit({
        userId: adminId,
        action: 'USER_UPDATE',
        targetId: id,
        targetType: 'User',
        metadata: changes,
      }).catch((err) => logger.warn('Audit log failed', { error: (err as Error).message }));
    }
  }

  if (data.status === 'SUSPENDED') {
    if (notificationsQueue) {
      try {
        await notificationsQueue.add('account-suspended', {
          userId: id,
          email: user.email,
        });
      } catch (err) {
        logger.warn('Failed to enqueue suspension notification, trying direct', {
          error: (err as Error).message,
        });
        if (user.email) await sendSuspensionEmailDirect(user.email);
      }
    } else {
      if (user.email) await sendSuspensionEmailDirect(user.email);
    }
  }

  return user;
}

async function sendSuspensionEmailDirect(email: string) {
  try {
    await sendEmail(
      email,
      'Your WeTheYuva account has been suspended',
      '<h2>Account suspended</h2><p>Your WeTheYuva account has been suspended. You will not be able to log in until the suspension is lifted.</p><p>If you believe this is a mistake, please contact our support team.</p>',
      'Your WeTheYuva account has been suspended. If you believe this is a mistake, please contact our support team.'
    );
  } catch (err) {
    logger.warn('Failed to send suspension email directly', { error: (err as Error).message });
  }
}
