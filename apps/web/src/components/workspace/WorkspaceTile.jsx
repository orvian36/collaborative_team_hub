'use client';

import Link from 'next/link';

const initials = (name) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || '')
    .join('') || '?';

export default function WorkspaceTile({ workspace, isActive, href, title }) {
  const bg = workspace.accentColor || '#3b82f6';
  return (
    <Link
      href={href}
      title={title || workspace.name}
      className={`relative flex items-center justify-center w-12 h-12 rounded-lg overflow-hidden text-white font-semibold transition-all hover:scale-105 ${
        isActive ? 'ring-2 ring-offset-2 ring-offset-gray-900 ring-white' : ''
      }`}
      style={{ backgroundColor: bg }}
    >
      {workspace.iconUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={workspace.iconUrl}
          alt=""
          className="w-full h-full object-cover"
        />
      ) : (
        <span className="text-base">{initials(workspace.name)}</span>
      )}
    </Link>
  );
}
