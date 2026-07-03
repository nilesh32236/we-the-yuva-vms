import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    volunteerProfile: { findUnique: vi.fn() },
    user: { findUnique: vi.fn() },
    opportunity: { findMany: vi.fn() },
    application: { findMany: vi.fn() },
  },
}));

const { prisma } = await import('@/lib/prisma');

import { getRecommendedOpportunities } from '../matching.service';

const baseOpp = {
  id: 'opp-1',
  title: 'Teach Math',
  description: 'Tutoring for grades 6-8',
  skills: ['Teaching', 'Math'],
  category: 'EDUCATION',
  status: 'ACTIVE',
  startDate: new Date(Date.now() + 86400000),
  endDate: new Date(Date.now() + 86400000 * 30),
  hoursPerSession: 2,
  totalSlots: 10,
  isRemote: false,
  organizationId: 'org-1',
  createdById: 'user-1',
  locationId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  _count: { applications: 2 },
  location: null,
};

describe('matching.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.application.findMany).mockResolvedValue([]);
  });

  it('should return empty array on prisma error', async () => {
    vi.mocked(prisma.volunteerProfile.findUnique).mockRejectedValue(new Error('DB down'));
    const result = await getRecommendedOpportunities('user-1');
    expect(result).toEqual([]);
  });

  it('should return recent opportunities with matchScore 0 when no profile', async () => {
    vi.mocked(prisma.volunteerProfile.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.opportunity.findMany).mockResolvedValue([baseOpp] as never);
    const result = await getRecommendedOpportunities('user-1');
    expect(result[0].matchScore).toBe(0);
  });

  it('should return recent opportunities with matchScore 0 when no skills/interests', async () => {
    vi.mocked(prisma.volunteerProfile.findUnique).mockResolvedValue({
      skills: [],
      interests: [],
      availability: { days: [] },
    } as never);
    vi.mocked(prisma.opportunity.findMany).mockResolvedValue([baseOpp] as never);
    const result = await getRecommendedOpportunities('user-1');
    expect(result).toHaveLength(1);
    expect(result[0].matchScore).toBe(0);
  });

  it('should score opportunities based on skill overlap, interest, location, and availability', async () => {
    vi.mocked(prisma.volunteerProfile.findUnique).mockResolvedValue({
      skills: ['Teaching', 'Math'],
      interests: ['education'],
      availability: { days: ['Monday'] },
    } as never);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      location: {
        lat: 23.0225,
        lng: 72.5714,
        name: 'Ahmedabad',
        district: 'Ahmedabad',
        state: 'Gujarat',
      },
    } as never);
    vi.mocked(prisma.opportunity.findMany).mockResolvedValue([baseOpp] as never);
    const result = await getRecommendedOpportunities('user-1');
    expect(result[0].matchScore).toBeGreaterThan(0);
  });

  it('should score location proximity higher for nearby opportunities', async () => {
    const nearbyOpp = {
      ...baseOpp,
      id: 'opp-nearby',
      location: {
        lat: 23.03,
        lng: 72.58,
        name: 'Ahmedabad',
        district: 'Ahmedabad',
        state: 'Gujarat',
      },
    };
    const farOpp = {
      ...baseOpp,
      id: 'opp-far',
      location: {
        lat: 19.076,
        lng: 72.877,
        name: 'Mumbai',
        district: 'Mumbai',
        state: 'Maharashtra',
      },
    };
    vi.mocked(prisma.volunteerProfile.findUnique).mockResolvedValue({
      skills: [],
      interests: [],
      availability: { days: [] },
    } as never);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      location: {
        lat: 23.0225,
        lng: 72.5714,
        name: 'Ahmedabad',
        district: 'Ahmedabad',
        state: 'Gujarat',
      },
    } as never);
    vi.mocked(prisma.opportunity.findMany).mockResolvedValue([nearbyOpp, farOpp] as never);
    const result = await getRecommendedOpportunities('user-1');
    expect(result[0].id).toBe('opp-nearby');
    expect(result[0].matchScore).toBeGreaterThan(result[1].matchScore);
  });

  it('should filter out full opportunities', async () => {
    const fullOpp = { ...baseOpp, _count: { applications: 10 } };
    vi.mocked(prisma.volunteerProfile.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.opportunity.findMany).mockResolvedValue([fullOpp] as never);
    const result = await getRecommendedOpportunities('user-1');
    expect(result).toHaveLength(0);
  });

  it('should return at most 10 results', async () => {
    const manyOpps = Array.from({ length: 15 }, (_, i) => ({
      ...baseOpp,
      id: `opp-${i + 1}`,
      title: `Opp ${i + 1}`,
      _count: { applications: 0 },
      createdAt: new Date(Date.now() + i * 1000),
    }));
    vi.mocked(prisma.volunteerProfile.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.opportunity.findMany).mockResolvedValue(manyOpps as never);
    const result = await getRecommendedOpportunities('user-1');
    expect(result.length).toBeLessThanOrEqual(10);
  });
});
