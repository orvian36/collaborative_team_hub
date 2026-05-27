function invitationTemplate({ invitation, workspace, inviter, inviteUrl }) {
  const subject = `${inviter?.name || 'Someone'} invited you to ${workspace.name} on Team Hub`;
  const text = `Hi,

${inviter?.name || 'Someone'} invited you to join the workspace "${workspace.name}" on Team Hub as ${invitation.role}.

Accept the invitation: ${inviteUrl}

This link expires on ${new Date(invitation.expiresAt).toLocaleDateString()}.
`;
  const html = `
    <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
      <h2 style="color: #111;">You've been invited to ${escapeHtml(workspace.name)}</h2>
      <p style="color: #444;">${escapeHtml(inviter?.name || 'Someone')} invited you to join as <strong>${escapeHtml(invitation.role)}</strong>.</p>
      <p style="margin: 24px 0;">
        <a href="${inviteUrl}" style="display: inline-block; background: ${escapeAttr(workspace.accentColor || '#3b82f6')}; color: white; text-decoration: none; padding: 10px 16px; border-radius: 6px;">Accept invitation</a>
      </p>
      <p style="color: #666; font-size: 12px;">This link expires on ${new Date(invitation.expiresAt).toLocaleDateString()}. If you didn't expect this invite, you can ignore it.</p>
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
function escapeAttr(s) {
  return escapeHtml(s);
}

module.exports = { invitationTemplate };
