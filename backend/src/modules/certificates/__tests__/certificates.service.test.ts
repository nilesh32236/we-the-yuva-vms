import { describe, expect, it } from 'vitest';
import { generateCertificateHtml } from '../certificates.service';

function sampleCert() {
  return {
    user: { name: 'Jane Doe' },
    level: { name: 'Community Champion', tier: 3 },
    verificationHash: 'abc-123-def-456',
    issuedAt: new Date('2026-01-15T00:00:00.000Z'),
  };
}

function cssRule(html: string, selector: string): string {
  const start = html.indexOf(selector);
  if (start === -1) return '';
  const brace = html.indexOf('{', start);
  const end = html.indexOf('}', brace);
  return html.slice(start, end + 1);
}

describe('generateCertificateHtml', () => {
  it('renders a full HTML document with lang and charset', () => {
    const html = generateCertificateHtml(sampleCert());
    expect(html.startsWith('<!DOCTYPE html>')).toBe(true);
    expect(html).toContain('<html lang="en">');
    expect(html).toContain('<meta charset="UTF-8">');
  });

  it('uses AA-contrast verification hash and footer text', () => {
    const html = generateCertificateHtml(sampleCert());
    expect(cssRule(html, '.verification-hash')).toContain('color: #64748b;');
    expect(cssRule(html, '.footer ')).toContain('color: #64748b;');
  });

  it('uses AA-contrast org-name and footer link color', () => {
    const html = generateCertificateHtml(sampleCert());
    expect(cssRule(html, '.org-name')).toContain('color: #0f766e;');
    expect(cssRule(html, '.footer a')).toContain('color: #0f766e;');
  });

  it('uses AA-contrast detail labels in dark mode', () => {
    const html = generateCertificateHtml(sampleCert());
    expect(html).toContain('.detail-label { color: #cbd5e1; }');
  });

  it('escapes user-supplied names', () => {
    const html = generateCertificateHtml({
      ...sampleCert(),
      user: { name: '<script>alert("x")</script>' },
    });
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('renders the verification hash and URL', () => {
    const html = generateCertificateHtml(sampleCert());
    expect(html).toContain('abc-123-def-456');
    expect(html).toContain('/verify/abc-123-def-456');
  });
});
