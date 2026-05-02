'use client';

const VARIANTS = {
  primary:
    'bg-primary-600 hover:bg-primary-700 text-white border border-transparent',
  secondary:
    'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-100 border border-transparent',
  danger: 'bg-red-600 hover:bg-red-700 text-white border border-transparent',
  outline:
    'bg-transparent hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-600',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  type = 'button',
  className = '',
  disabled,
  children,
  ...rest
}) {
  const sizing = size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm';
  return (
    <button
      type={type}
      disabled={disabled}
      className={`inline-flex items-center justify-center font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${VARIANTS[variant]} ${sizing} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
