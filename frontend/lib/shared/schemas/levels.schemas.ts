import { z } from 'zod';

export const PeerEndorsementSchema = z.object({
  userId: z.string().min(1).max(100),
  name: z.string().min(1).max(100),
  statement: z.string().min(1).max(2000),
});

export const CreateLevelRequestSchema = z.object({
  proofUrls: z.array(z.string().url()).optional(),
  videoUrl: z.string().url().optional(),
  proofData: z.record(z.unknown()).optional(),
  notes: z.string().max(1000).optional(),
  peerEndorsements: z.array(PeerEndorsementSchema).optional(),
});

export const ReviewLevelRequestSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  reviewNote: z.string().max(1000).optional(),
});

export const LevelRecordSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    tier: z.number().int(),
    description: z.string().optional(),
    requirements: z.record(z.unknown()).optional(),
    badgeIcon: z.string().optional(),
    color: z.string().optional(),
    gradient: z.string().optional(),
    badgeShape: z.string().optional(),
    pointsRequired: z.number().int().optional(),
  })
  .passthrough();

export const LevelListSchema = z.array(LevelRecordSchema);
export type LevelList = z.infer<typeof LevelListSchema>;

export const MyLevelResponseSchema = z.object({
  currentLevel: LevelRecordSchema.nullish(),
  points: z.number(),
  streak: z.number(),
  longestStreak: z.number(),
  totalHours: z.number(),
  allLevels: z.array(LevelRecordSchema).optional(),
});
export type MyLevelResponse = z.infer<typeof MyLevelResponseSchema>;

export interface NormalizedLevel {
  tier: number;
  points: number;
  pointsToNext: number;
  streak: number;
  hoursVolunteered: number;
  nextLevel: {
    id: string;
    name: string;
    pointsRequired: number;
    requirements: Record<string, unknown>;
  } | null;
}

export function normalizeMyLevel(res: MyLevelResponse): NormalizedLevel {
  const tier = res.currentLevel?.tier ?? 0;
  const next = res.allLevels?.find((l) => l.tier === tier + 1) ?? null;
  return {
    tier,
    points: res.points,
    pointsToNext: next?.pointsRequired ?? 0,
    streak: res.streak,
    hoursVolunteered: res.totalHours,
    nextLevel: next
      ? {
          id: next.id,
          name: next.name,
          pointsRequired: next.pointsRequired ?? 0,
          requirements: next.requirements ?? {},
        }
      : null,
  };
}

export type CreateLevelRequestInput = z.infer<typeof CreateLevelRequestSchema>;
export type ReviewLevelRequestInput = z.infer<typeof ReviewLevelRequestSchema>;
