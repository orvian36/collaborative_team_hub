// apps/web/src/components/mentions/caretCoordinates.js
'use client';

/**
 * Compute viewport coordinates of the caret inside a <textarea>.
 *
 * Approach: render an absolutely-positioned, off-screen <div> that mirrors
 * the textarea's font/padding/border styles, slice the textarea's value up
 * to the caret index, append a marker <span>, then read the marker's
 * bounding rect. This is the standard technique — the DOM has no native
 * "caret position" API for textareas.
 *
 * Returns { top, left } in viewport coordinates (suitable for position:fixed).
 */
const COPIED_PROPS = [
  'direction',
  'boxSizing',
  'width',
  'height',
  'overflowX',
  'overflowY',
  'borderTopWidth',
  'borderRightWidth',
  'borderBottomWidth',
  'borderLeftWidth',
  'borderStyle',
  'paddingTop',
  'paddingRight',
  'paddingBottom',
  'paddingLeft',
  'fontStyle',
  'fontVariant',
  'fontWeight',
  'fontStretch',
  'fontSize',
  'fontSizeAdjust',
  'lineHeight',
  'fontFamily',
  'textAlign',
  'textTransform',
  'textIndent',
  'textDecoration',
  'letterSpacing',
  'wordSpacing',
  'tabSize',
];

export function getCaretCoordinates(textarea, position) {
  if (typeof document === 'undefined' || !textarea) {
    return { top: 0, left: 0 };
  }

  const div = document.createElement('div');
  div.id = '__mention_caret_mirror__';
  document.body.appendChild(div);

  const style = div.style;
  const computed = window.getComputedStyle(textarea);

  style.whiteSpace = 'pre-wrap';
  style.wordWrap = 'break-word';
  style.position = 'absolute';
  style.visibility = 'hidden';
  style.top = '0';
  style.left = '-9999px';

  for (const prop of COPIED_PROPS) {
    style[prop] = computed[prop];
  }

  div.textContent = textarea.value.substring(0, position);
  const span = document.createElement('span');
  // A non-empty span makes sure we get a measurable rect even at end of text.
  span.textContent = textarea.value.substring(position) || '.';
  div.appendChild(span);

  const taRect = textarea.getBoundingClientRect();
  const spanRect = span.getBoundingClientRect();
  const mirrorRect = div.getBoundingClientRect();

  // Account for the mirror sitting at left:-9999px by subtracting its origin.
  const top =
    taRect.top + (spanRect.top - mirrorRect.top) - textarea.scrollTop;
  const left =
    taRect.left + (spanRect.left - mirrorRect.left) - textarea.scrollLeft;

  document.body.removeChild(div);

  // Drop the popup just below the caret line. Using line-height as the
  // approximate caret height keeps the offset stable across font sizes.
  const lineHeight = parseFloat(computed.lineHeight) || 18;
  return { top: top + lineHeight + 4, left };
}
