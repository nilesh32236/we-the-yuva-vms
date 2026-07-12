import crypto from 'node:crypto';
import { prisma } from '../../lib/prisma';
import { logger } from '../../lib/logger';
import { notificationsQueue } from '../../lib/queue';
import { AppError } from '../../middleware/error.middleware';

export async function generateCertificate(userId: string, levelId: string) {
  const verificationHash = crypto.randomUUID();

  const certificate = await prisma.$transaction(async (tx) => {
    const cert = await tx.certificate.create({
      data: {
        userId,
        levelId,
        verificationHash,
        certificateUrl: '',
      },
    });

    return tx.certificate.update({
      where: { id: cert.id },
      data: { certificateUrl: `/api/v1/certificates/${cert.id}/view` },
      include: { level: true },
    });
  });

  if (certificate && notificationsQueue) {
    try {
      await notificationsQueue.add('certificate-issued', {
        userId: certificate.userId,
        certificateTitle: certificate.level?.name ?? 'Certificate',
        certificateId: certificate.id,
      });
    } catch (err) {
      logger.warn('Failed to enqueue certificate-issued notification', {
        error: (err as Error).message,
        certificateId: certificate.id,
      });
    }
  }

  return certificate;
}

export async function listMyCertificates(userId: string, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    prisma.certificate.findMany({
      where: { userId },
      skip,
      take: limit,
      include: { level: true, user: { select: { id: true, name: true } } },
      orderBy: { issuedAt: 'desc' },
    }),
    prisma.certificate.count({ where: { userId } }),
  ]);
  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getCertificate(id: string, userId: string) {
  const cert = await prisma.certificate.findUnique({
    where: { id },
    include: { level: true, user: { select: { id: true, name: true } } },
  });

  if (!cert || cert.userId !== userId) {
    throw new AppError('Certificate not found', 404);
  }

  return cert;
}

export async function getCertificateByHash(hash: string) {
  const cert = await prisma.certificate.findUnique({
    where: { verificationHash: hash },
    include: { user: true, level: true },
  });

  if (!cert) {
    throw new AppError('Certificate not found', 404);
  }

  return cert;
}

export function generateCertificateHtml(cert: {
  user: { name: string };
  level: { name: string; tier: number };
  verificationHash: string;
  issuedAt: Date;
  autoPrint?: boolean;
}) {
  const volunteerName = cert.user.name;
  const levelName = cert.level.name;
  const tier = cert.level.tier;
  const issuedDate = cert.issuedAt.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const verificationUrl = `${process.env.FRONTEND_URL || ''}/verify/${cert.verificationHash}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Certificate of Achievement - WeTheYuva</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Georgia', 'Times New Roman', serif;
      background: #f4f6f9;
      color: #1a1a2e;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 2rem;
    }
    .certificate {
      max-width: 900px;
      width: 100%;
      background: #ffffff;
      border: 8px solid #0d9488;
      padding: 3rem;
      position: relative;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
    }
    .certificate::before {
      content: '';
      position: absolute;
      top: 12px;
      left: 12px;
      right: 12px;
      bottom: 12px;
      border: 2px solid #14b8a6;
      pointer-events: none;
    }
    .org-name {
      text-align: center;
      font-size: 1.1rem;
      letter-spacing: 4px;
      text-transform: uppercase;
      color: #0d9488;
      font-weight: 600;
      margin-bottom: 1.5rem;
    }
    .title {
      text-align: center;
      font-size: 2.5rem;
      font-weight: 700;
      color: #0f766e;
      margin-bottom: 0.5rem;
      text-transform: uppercase;
      letter-spacing: 2px;
    }
    .subtitle {
      text-align: center;
      font-size: 1rem;
      color: #64748b;
      margin-bottom: 2.5rem;
    }
    .presented-to {
      text-align: center;
      font-size: 1rem;
      color: #475569;
      margin-bottom: 0.5rem;
    }
    .volunteer-name {
      text-align: center;
      font-size: 2.2rem;
      font-weight: 700;
      color: #1a1a2e;
      margin-bottom: 1.5rem;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 0.5rem;
    }
    .achievement-text {
      text-align: center;
      font-size: 1.1rem;
      color: #475569;
      line-height: 1.8;
      margin-bottom: 2rem;
    }
    .level-name {
      display: inline-block;
      background: #0d9488;
      color: #ffffff;
      padding: 0.4rem 2rem;
      font-size: 1.3rem;
      font-weight: 600;
      letter-spacing: 1px;
      margin: 0 auto 1.5rem;
      text-align: center;
    }
    .level-name-container {
      text-align: center;
    }
    .details {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 2px solid #e2e8f0;
      padding-top: 1.5rem;
      margin-top: 1.5rem;
      font-size: 0.9rem;
      color: #64748b;
    }
    .detail-item {
      text-align: center;
    }
    .detail-label {
      font-weight: 600;
      color: #475569;
      margin-bottom: 0.25rem;
    }
    .verified-badge {
      text-align: center;
      margin-top: 2rem;
      padding: 1rem;
      background: #f0fdfa;
      border: 1px solid #14b8a6;
      border-radius: 4px;
    }
    .verified-badge h3 {
      color: #0f766e;
      font-size: 1rem;
      margin-bottom: 0.3rem;
    }
    .verified-badge p {
      font-size: 0.8rem;
      color: #64748b;
    }
    .verification-hash {
      font-family: 'Courier New', monospace;
      font-size: 0.75rem;
      word-break: break-all;
      color: #94a3b8;
      margin-top: 0.3rem;
    }
    .footer {
      text-align: center;
      margin-top: 2rem;
      font-size: 0.8rem;
      color: #94a3b8;
    }
    .footer a {
      color: #0d9488;
      text-decoration: none;
    }
    @media print {
      body {
        background: #ffffff;
        padding: 0;
      }
      .certificate {
        box-shadow: none;
        border: 8px solid #0d9488;
        page-break-inside: avoid;
      }
      .certificate::before {
        border: 2px solid #14b8a6;
      }
      .verified-badge {
        border: 1px solid #14b8a6;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .level-name {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }
    @media (prefers-color-scheme: dark) {
      body {
        background: #0f172a;
      }
      .certificate {
        background: #1e293b;
        border-color: #14b8a6;
      }
      .certificate::before {
        border-color: #0d9488;
      }
      .org-name { color: #2dd4bf; }
      .title { color: #5eead4; }
      .subtitle, .presented-to, .achievement-text { color: #cbd5e1; }
      .volunteer-name { color: #f1f5f9; border-bottom-color: #334155; }
      .detail-label { color: #94a3b8; }
      .detail-item { color: #cbd5e1; }
      .level-name { background: #0d9488; }
      .verified-badge {
        background: #0f2937;
        border-color: #0d9488;
      }
      .verified-badge h3 { color: #2dd4bf; }
      .verified-badge p { color: #94a3b8; }
      .verification-hash { color: #64748b; }
      .footer { color: #64748b; }
      .footer a { color: #2dd4bf; }
    }
  </style>
</head>
<body>
  <div class="certificate">
    <div class="org-name">WeTheYuva</div>
    <div class="title">Certificate of Achievement</div>
    <div class="subtitle">Volunteer Management System</div>

    <div class="presented-to">Presented to</div>
    <div class="volunteer-name">${volunteerName}</div>

    <div class="achievement-text">
      In recognition of their dedication and contribution to community service,<br>
      this certificate is awarded for achieving <strong>Tier ${tier}</strong> status.
    </div>

    <div class="level-name-container">
      <div class="level-name">${levelName}</div>
    </div>

    <div class="details">
      <div class="detail-item">
        <div class="detail-label">Date Issued</div>
        <div>${issuedDate}</div>
      </div>
      <div class="detail-item">
        <div class="detail-label">Verification Hash</div>
        <div class="verification-hash">${cert.verificationHash}</div>
      </div>
    </div>

    <div class="verified-badge">
      <h3>Verified on WeTheYuva</h3>
      <p>This certificate is digitally verified. Scan or visit the URL below to verify.</p>
      <div class="verification-hash">${verificationUrl}</div>
    </div>

    <div class="footer">
      <a href="https://wetheyuva.org">www.wetheyuva.org</a> &mdash; Building civic leaders, one step at a time.
    </div>
  </div>
  ${cert.autoPrint ? '<script>setTimeout(() => window.print(), 800)</script>' : ''}
</body>
</html>`;
}
