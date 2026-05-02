/**
 * Extract user IDs from sanitized announcement HTML and from
 * markdown-style mention tokens used in plain-text fields (comments,
 * goal activity messages).
 *
 * - Sanitized HTML: looks for `<span data-type="mention" data-id="...">`
 * - Markdown:       looks for `@[Display Name](user-id)` tokens
 *
 * Output is deduplicated. Self-mentions (when an actor mentions themselves)
 * are NOT filtered here — callers are responsible for that.
 */

function extractFromHtml(html) {
  if (!html) return [];
  const ids = [];
  const re = /<span[^>]*\bdata-type=["']mention["'][^>]*\bdata-id=["']([a-f0-9-]{36})["']/gi;
  let m;
  while ((m = re.exec(html))) ids.push(m[1]);
  return Array.from(new Set(ids));
}

function extractFromMarkdown(text) {
  if (!text) return [];
  const ids = [];
  const re = /@\[[^\]]+\]\(([a-f0-9-]{36})\)/g;
  let m;
  while ((m = re.exec(text))) ids.push(m[1]);
  return Array.from(new Set(ids));
}

module.exports = { extractFromHtml, extractFromMarkdown };
