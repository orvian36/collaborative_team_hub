const sanitizeHtml = require('sanitize-html');

const ALLOWED_TAGS = [
  'p',
  'br',
  'strong',
  'em',
  'u',
  's',
  'code',
  'h1',
  'h2',
  'h3',
  'ul',
  'ol',
  'li',
  'blockquote',
  'pre',
  'a',
  'span',
];

const ALLOWED_ATTRS = {
  a: ['href', 'title', 'target', 'rel'],
  span: ['data-type', 'data-id', 'data-label', 'class'], // TipTap mention spans
};

/**
 * Sanitize TipTap HTML output.
 * - Strips disallowed tags/attrs.
 * - Forces external links to open in a new tab with safe rels.
 * - Preserves mention spans (`data-type="mention"` etc.).
 */
function sanitizeAnnouncementHtml(html) {
  return sanitizeHtml(html || '', {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: ALLOWED_ATTRS,
    allowedSchemes: ['http', 'https', 'mailto'],
    transformTags: {
      a: (tagName, attribs) => ({
        tagName,
        attribs: {
          ...attribs,
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      }),
    },
  });
}

module.exports = { sanitizeAnnouncementHtml };
