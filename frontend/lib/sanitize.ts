import DOMPurify from 'dompurify';

const ALLOWED_TAGS = [
  'p',
  'h1',
  'h2',
  'h3',
  'ul',
  'ol',
  'li',
  'blockquote',
  'pre',
  'code',
  'strong',
  'em',
  'br',
  'hr',
  'a',
  'img',
];

const ALLOWED_ATTR = ['href', 'target', 'rel', 'src', 'alt', 'title'];

export function sanitizeRichContent(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
  });
}
