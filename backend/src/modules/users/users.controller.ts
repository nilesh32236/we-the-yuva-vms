import type { NextFunction, Request, Response } from 'express';
import {
  exportCoordinatorVolunteers,
  getCoordinatorVolunteers,
  getMe,
  getProfileStatus,
  getUserProfile,
  submitOnboarding,
  updateUser,
  upsertStaffProfile,
  upsertVolunteerProfile,
} from './users.service';

export async function getMeHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await getMe(req.user!.id);
    res.status(200).json(user);
  } catch (err) {
    next(err);
  }
}

export async function getProfileStatusHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const status = await getProfileStatus(req.user!.id);
    res.status(200).json(status);
  } catch (err) {
    next(err);
  }
}

export async function updateMeHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await updateUser(req.user!.id, req.body);
    res.status(200).json(user);
  } catch (err) {
    next(err);
  }
}

export async function createVolunteerProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const profile = await upsertVolunteerProfile(req.user!.id, req.body);
    res.status(201).json(profile);
  } catch (err) {
    next(err);
  }
}

export async function updateVolunteerProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const profile = await upsertVolunteerProfile(req.user!.id, req.body);
    res.status(200).json(profile);
  } catch (err) {
    next(err);
  }
}

export async function submitOnboardingHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await submitOnboarding(req.user!.id, req.body);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function createStaffProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await upsertStaffProfile(req.user!.id, req.body);
    res.status(201).json(user);
  } catch (err) {
    next(err);
  }
}

export async function updateStaffProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await upsertStaffProfile(req.user!.id, req.body);
    res.status(200).json(user);
  } catch (err) {
    next(err);
  }
}

export async function getUserProfileHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = await getUserProfile(
      req.params.id,
      req.user!.id,
      req.user!.role,
      req.user!.organizationId
    );
    res.status(200).json(user);
  } catch (err) {
    next(err);
  }
}

export async function getCoordinatorVolunteersHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit as string, 10) || 20));
    const search = req.query.search as string | undefined;
    const raw = req.query.skills;
    const skillsStr = Array.isArray(raw) ? String(raw) : (raw as string);
    const skills = skillsStr
      ? skillsStr
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : undefined;

    const result = await getCoordinatorVolunteers(
      req.user!.id,
      req.user!.organizationId,
      { search, skills },
      { page, limit }
    );
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

function sanitizeCsvCell(value: string): string {
  const escaped = value.replace(/"/g, '""');
  if (/^[=+\-@]/.test(escaped)) {
    return `'${escaped}`;
  }
  return escaped;
}

export async function exportVolunteersHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="volunteers.csv"');
    const rows = await exportCoordinatorVolunteers(req.user!.id, req.user!.organizationId);
    const csv = [
      'name,email,type,skills,totalHours,applicationCount',
      ...rows.map(
        (r) =>
          `"${sanitizeCsvCell(r.name)}","${sanitizeCsvCell(r.email)}","${sanitizeCsvCell(r.type)}","${sanitizeCsvCell(r.skills.join(';'))}","${r.totalHours}","${r.applicationCount}"`
      ),
    ].join('\n');
    res.send(csv);
  } catch (err) {
    next(err);
  }
}
