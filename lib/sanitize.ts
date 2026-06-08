// Strip HTML tags and control characters from user-supplied plain text.
// Prisma uses parameterized queries so SQL injection isn't a concern;
// this focuses on preventing stored XSS in fields rendered server-side or
// in contexts that might use dangerouslySetInnerHTML.

const TAG_RE = /<[^>]*>/g;
// Remove ASCII control characters (except tab \x09, newline \x0A, carriage return \x0D)
const CTRL_RE = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;

export function stripTags(value: string): string {
  return value.replace(TAG_RE, "").replace(CTRL_RE, "");
}

/** Sanitize a plain-text field: strip HTML tags, trim, enforce max length. */
export function sanitizeText(
  value: string | null | undefined,
  maxLength = 10_000
): string | undefined {
  if (value == null) return undefined;
  const clean = stripTags(value).trim();
  return clean.slice(0, maxLength) || undefined;
}

/** Same as sanitizeText but returns empty string instead of undefined. */
export function sanitizeField(
  value: string | null | undefined,
  maxLength = 10_000
): string {
  return sanitizeText(value, maxLength) ?? "";
}

/**
 * Validate that a URL is safe to use in href/src attributes.
 * Rejects javascript:, data:, and vbscript: schemes.
 * Returns null if the URL is unsafe or not a recognised scheme.
 */
export function sanitizeUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (/^(javascript|data|vbscript):/i.test(trimmed)) return null;
  return trimmed;
}

/**
 * Sanitize product metafields: an array of { label, value } spec rows.
 * Drops rows missing a label, strips tags, enforces lengths, caps count.
 */
export function sanitizeMetafields(arr: unknown, max = 30): { label: string; value: string }[] {
  if (!Array.isArray(arr)) return [];
  return arr
    .map(row => {
      const r = row as { label?: unknown; value?: unknown };
      const label = sanitizeText(typeof r?.label === "string" ? r.label : "", 80) ?? "";
      const value = sanitizeText(typeof r?.value === "string" ? r.value : "", 500) ?? "";
      return { label, value };
    })
    .filter(r => r.label)
    .slice(0, max);
}

/** Sanitize an array of strings (e.g. tags, image URLs). */
export function sanitizeArray(
  arr: unknown,
  isUrl = false,
  maxLength = 200
): string[] {
  if (!Array.isArray(arr)) return [];
  return arr
    .filter((v): v is string => typeof v === "string")
    .map(v => (isUrl ? sanitizeUrl(v) ?? "" : sanitizeText(v, maxLength) ?? ""))
    .filter(Boolean);
}
