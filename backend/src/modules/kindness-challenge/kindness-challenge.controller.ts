import type { NextFunction, Request, Response } from 'express';
import {
  getMyChallenge,
  listChallengesForAdmin,
  checkIn,
  linkExistingStory,
  startChallenge,
} from './kindness-challenge.service';

export async function startChallengeHandler(req: Request, res: Response, _next: NextFunction) {
  const { acts, startDate } = req.body as { acts: string[]; startDate: string };
  const challenge = await startChallenge(req.user!.id, { acts, startDate: new Date(startDate) });
  res.status(201).json(challenge);
}

export async function getMyChallengeHandler(req: Request, res: Response, _next: NextFunction) {
  res.json(await getMyChallenge(req.user!.id));
}

export async function checkInHandler(req: Request, res: Response, _next: NextFunction) {
  res.json(await checkIn(req.user!.id));
}

export async function linkStoryHandler(req: Request, res: Response, _next: NextFunction) {
  const { storyId } = req.body as { storyId: string };
  res.json(await linkExistingStory(req.user!.id, storyId));
}

export async function adminListChallengesHandler(req: Request, res: Response, _next: NextFunction) {
  const { status, source } = req.query as { status?: 'ACTIVE' | 'COMPLETED'; source?: string };
  res.json(await listChallengesForAdmin({ status, source }));
}

export async function adminExportChallengesHandler(req: Request, res: Response, _next: NextFunction) {
  const { status, source } = req.query as { status?: 'ACTIVE' | 'COMPLETED'; source?: string };
  // TODO: stream with res.write/pipeline for large tenants; currently buffered (ok for <10k rows).
  // If dataset grows, add pagination or cursor streaming and enforce a max limit.
  const rows = await listChallengesForAdmin({ status, source });

  const esc = (v: unknown) => `"${String(v ?? '').replaceAll('"', '""')}"`;
  const header = 'name,email,whatsapp,registered_at,referral_source,status,checkins,story_shared,part2_unlocked,start_date';
  const body = rows.map((r) =>
    [
      r.user.name,
      r.user.email,
      r.user.whatsappNumber ?? r.user.phone,
      r.user.createdAt?.toISOString(),
      r.user.referralSource,
      r.status,
      r.checkIns.map((c) => c.day).join(';'),
      r.storyId ? 'yes' : 'no',
      r.part2UnlockedAt ? 'yes' : 'no',
      r.startDate.toISOString().slice(0, 10),
    ]
      .map(esc)
      .join(',')
  );

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="kindness-challenges.csv"');
  res.send([header, ...body].join('\n'));
}
