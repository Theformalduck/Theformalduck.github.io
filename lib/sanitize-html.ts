// Allowlist sanitizer for the small subset of rich text the newsletter editor
// produces. Keeps basic formatting tags, drops everything else (scripts, styles,
// event handlers, unsafe link schemes). Defense-in-depth: the author is an
// authenticated store owner and email clients sanitize again on render, but we
// never want to emit script/handlers or javascript: URLs.

const ALLOWED = new Set([
  "p", "br", "b", "strong", "i", "em", "u", "s", "strike",
  "a", "ul", "ol", "li", "h1", "h2", "h3", "blockquote", "span", "div",
]);

export function sanitizeRichHtml(input: string, maxLen = 20_000): string {
  let html = String(input ?? "").slice(0, maxLen);

  // Drop comments and any <script>/<style> blocks (tag + contents) entirely.
  html = html.replace(/<!--[\s\S]*?-->/g, "");
  html = html.replace(/<(script|style)[\s\S]*?<\/\s*\1\s*>/gi, "");

  // Rewrite every remaining tag: keep allowed ones with no attributes (except a
  // safe href on <a>); strip the markup of everything else (its text stays).
  html = html.replace(/<\s*(\/?)\s*([a-zA-Z0-9]+)([^>]*?)(\/?)>/g, (_m, slash: string, tag: string, attrs: string) => {
    const t = tag.toLowerCase();
    if (!ALLOWED.has(t)) return "";
    if (slash) return `</${t}>`;
    if (t === "a") {
      const hm = attrs.match(/href\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'>]+))/i);
      const href = (hm ? (hm[2] ?? hm[3] ?? hm[4] ?? "") : "").trim();
      if (/^(https?:\/\/|mailto:)/i.test(href)) {
        return `<a href="${href.replace(/"/g, "&quot;")}" target="_blank" rel="noopener noreferrer">`;
      }
      return "<a>";
    }
    return `<${t}>`;
  });

  return html;
}
