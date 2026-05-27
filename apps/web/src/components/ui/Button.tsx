'use client';

const VARIANTS = {
  primary:
    'bg-primary-600 hover:bg-primary-700 text-white shadow-soft border border-transparent',
  secondary:
    'bg-[color:var(--surface-2)] hover:bg-[color:var(--surface-3)] text-fg border border-line',
  ghost:
    'bg-transparent hover:bg-[color:var(--surface-2)] text-fg border border-transparent',
  danger:
    'bg-rose-600 hover:bg-rose-700 text-white shadow-soft border border-transparent',
  outline:
    'bg-transparent hover:bg-[color:var(--surface-2)] text-fg border border-line-strong',
  contrast:
    'bg-[color:var(--fg)] hover:opacity-90 text-[color:var(--bg)] border border-transparent',
};

const SIZES = {
  sm: 'px-3 py-1.5 text-xs rounded-lg gap-1.5',
  md: 'px-4 py-2 text-sm rounded-lg gap-2',
  lg: 'px-5 py-2.5 text-sm rounded-xl gap-2',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  type = 'button',
  className = '',
  disabled,
  loading,
  children,
  leftIcon,
  rightIcon,
  ...rest
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`relative inline-flex items-center justify-center font-medium tracking-tight transition-colors focus-ring disabled:opacity-50 disabled:cursor-not-allowed ${SIZES[size]} ${VARIANTS[variant]} ${className}`}
      {...rest}
    >
      {loading && (
        <span
          className="absolute inset-0 grid place-items-center"
          aria-hidden
        >
          <span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
        </span>
      )}
      <span
        className={`inline-flex items-center justify-center ${SIZES[size].split(' ').find((c) => c.startsWith('gap-')) || 'gap-2'} ${loading ? 'opacity-0' : ''}`}
      >
        {leftIcon}
        {children}
        {rightIcon}
      </span>
    </button>
  );
}
