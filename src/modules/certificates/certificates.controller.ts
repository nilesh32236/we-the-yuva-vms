import type { NextFunction, Request, Response } from 'express';
import {
  listMyCertificates,
  getCertificate,
  getCertificateByHash,
  generateCertificateHtml,
} from './certificates.service';

export async function listCertificatesHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const certificates = await listMyCertificates(req.user!.id);
    res.status(200).json(certificates);
  } catch (err) {
    next(err);
  }
}

export async function getCertificateHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const cert = await getCertificate(req.params.id, req.user!.id);
    res.status(200).json(cert);
  } catch (err) {
    next(err);
  }
}

export async function viewCertificateHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const cert = await getCertificate(req.params.id, req.user!.id);
    const html = generateCertificateHtml({
      user: { name: cert.user?.name || req.user!.id },
      level: { name: cert.level.name, tier: cert.level.tier },
      verificationHash: cert.verificationHash,
      issuedAt: cert.issuedAt,
      autoPrint: req.query.print === '1',
    });
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(html);
  } catch (err) {
    next(err);
  }
}

export async function verifyCertificateHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const cert = await getCertificateByHash(req.params.hash);
    res.status(200).json({
      valid: true,
      certificate: {
        volunteerName: cert.user.name,
        levelName: cert.level.name,
        issuedAt: cert.issuedAt,
        verificationHash: cert.verificationHash,
      },
    });
  } catch (err) {
    next(err);
  }
}
