import { logAudit } from '../../lib/audit';
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

export async function createUser(adminId: string, data: {
  name: string;
  email: string;
  role: string;
  locationName?: string;
}) {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) throw new AppError('Email already registered', 409);

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

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      role: data.role as any,
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

  await logAudit({ userId: adminId, action: 'USER_CREATE', targetId: user.id, targetType: 'User', metadata: { role: data.role } });

  return user;
}

export async function listUsers(filters: ListUsersFilters, pagination: Pagination) {
  const { role, status, search } = filters;
  const { page, limit } = pagination;
  const skip = (page - 1) * limit;

  // Build where clause
  const where: Record<string, unknown> = {};
  if (role) where.role = role;
  if (status) where.status = status;
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
      include: {
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

export async function updateUser(
  id: string,
  data: { status?: string; role?: string },
  adminId?: string
) {
  // Verify user exists
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError('User not found', 404);
  }

  const user = await prisma.user.update({
    where: { id },
    data: {
      ...(data.status && { status: data.status as any }),
      ...(data.role && { role: data.role as any }),
    },
  });

  if (adminId) {
    const changes: Record<string, string> = {};
    if (data.status && data.status !== existing.status)
      changes.status = `${existing.status} → ${data.status}`;
    if (data.role && data.role !== existing.role) changes.role = `${existing.role} → ${data.role}`;

    if (data.status === 'SUSPENDED' && existing.status !== 'SUSPENDED') {
      await logAudit({ userId: adminId, action: 'USER_SUSPEND', targetId: id, targetType: 'User', metadata: changes });
    } else if (data.role && data.role !== existing.role) {
      await logAudit({ userId: adminId, action: 'USER_CHANGE_ROLE', targetId: id, targetType: 'User', metadata: changes });
    } else if (Object.keys(changes).length > 0) {
      await logAudit({ userId: adminId, action: 'USER_UPDATE', targetId: id, targetType: 'User', metadata: changes });
    }
  }

  if (data.status === 'SUSPENDED') {
    // Revoke all active refresh tokens
    await prisma.refreshToken.updateMany({
      where: { userId: id, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    // Enqueue account-suspended notification
    await notificationsQueue.add('account-suspended', {
      userId: id,
      email: user.email,
    });
  }

  return user;
}
