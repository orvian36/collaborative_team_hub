'use client';

import Link from 'next/link';

const initials = (name) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || '')
    .join('') || '?';

export default function WorkspaceTile({ workspace, isActive, href, title }) {
  const bg = workspace.accentColor || '#4a3aef';
  return (
    <div className="relative w-11 group">
      {/* Discord-style rail indicator: lives OUTSIDE the tile, on the rail itself */}
      <span
        aria-hidden
        className={`absolute -left-2 top-1/2 -translate-y-1/2 w-1 rounded-r-full bg-white transition-all duration-200 ${
          isActive
            ? 'h-7 opacity-100'
            : 'h-2 opacity-0 group-hover:opacity-70'
        }`}
      />
      <Link
        href={href}
        title={title || workspace.name}
        aria-current={isActive ? 'page' : undefined}
        className={`relative flex items-center justify-center w-11 h-11 overflow-hidden text-white font-semibold transition-all duration-200 ${
          isActive
            ? 'rounded-xl shadow-lift'
            : 'rounded-2xl group-hover:rounded-xl'
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
          <span className="text-[13px] tracking-tight">
            {initials(workspace.name)}
          </span>
        )}
      </Link>

      {/* Tooltip */}
      <span
        className="pointer-events-none absolute left-[60px] top-1/2 -translate-y-1/2 whitespace-nowrap rounded-md bg-ink-950 text-white text-xs font-medium px-2.5 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-lift"
        role="tooltip"
      >
        {workspace.name}
      </span>
    </div>
  );
}
