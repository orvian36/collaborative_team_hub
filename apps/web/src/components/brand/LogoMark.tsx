export default function LogoMark({ className = 'w-7 h-7' }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      role="img"
      aria-label="Team Hub"
    >
      <defs>
        <linearGradient id="thg" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#5d50fa" />
          <stop offset="100%" stopColor="#3e2dd1" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="32" height="32" rx="9" fill="url(#thg)" />
      <g fill="#fff">
        <circle cx="11" cy="12" r="3" />
        <circle cx="21" cy="12" r="3" />
        <path d="M5 24c0-3.5 3-6 8-6s8 2.5 8 6v1H5v-1z" opacity=".95" />
        <path d="M16 23c0-2.5 2.2-4.5 5.5-4.5S27 20.5 27 23v1H16v-1z" opacity=".7" />
      </g>
    </svg>
  );
}
