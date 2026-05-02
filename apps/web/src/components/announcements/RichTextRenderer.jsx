'use client';

export default function RichTextRenderer({ html }) {
  return (
    <div
      className="prose prose-sm max-w-none dark:prose-invert"
      // The HTML is sanitized server-side via sanitize-html before storage.
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
