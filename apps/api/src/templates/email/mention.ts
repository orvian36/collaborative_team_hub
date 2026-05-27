function mentionTemplate({ recipient, notification, link }) {
  const subject = `You were mentioned on Team Hub`;
  const text = `Hi ${recipient.name || ''},

${notification.message}

Open Team Hub: ${link}
`;
  const html = `
    <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
      <h2 style="color: #111;">You were mentioned</h2>
      <p style="color: #444;">${escapeHtml(notification.message)}</p>
      <p style="margin: 24px 0;">
        <a href="${link}" style="display: inline-block; background: #3b82f6; color: white; text-decoration: none; padding: 10px 16px; border-radius: 6px;">Open Team Hub</a>
      </p>
    </div>
  `;
  return { subject, html, text };
}

function escapeHtml(s) {
  return String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        c
      ]
  );
}

module.exports = { mentionTemplate };
