'use client';

import { useState, forwardRef } from 'react';

const TextField = forwardRef(function TextField(
  {
    id,
    label,
    type = 'text',
    autoComplete,
    required,
    value,
    onChange,
    placeholder,
    hint,
    rightSlot,
    error,
    name,
  },
  ref
) {
  const [revealed, setRevealed] = useState(false);
  const isPassword = type === 'password';
  const realType = isPassword ? (revealed ? 'text' : 'password') : type;

  return (
    <label htmlFor={id} className="block">
      <span className="flex items-center justify-between text-[13px] font-medium text-fg">
        <span>
          {label}
          {required && (
            <span className="ml-1 text-subtle font-normal">*</span>
          )}
        </span>
        {hint && <span className="text-xs text-subtle">{hint}</span>}
      </span>
      <span
        className={`mt-1.5 flex items-center rounded-xl border bg-[color:var(--surface)] transition-colors focus-within:ring-2 focus-within:ring-[color:var(--ring)] ${
          error
            ? 'border-rose-500'
            : 'border-line hover:border-line-strong focus-within:border-primary-500'
        }`}
      >
        <input
          id={id}
          ref={ref}
          name={name || id}
          type={realType}
          autoComplete={autoComplete}
          required={required}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="flex-1 bg-transparent px-4 py-3 text-[15px] text-fg placeholder:text-subtle focus:outline-none rounded-xl"
        />
        {isPassword ? (
          <button
            type="button"
            onClick={() => setRevealed((v) => !v)}
            className="px-3 text-xs text-subtle hover:text-fg transition-colors"
            aria-label={revealed ? 'Hide password' : 'Show password'}
          >
            {revealed ? 'Hide' : 'Show'}
          </button>
        ) : rightSlot ? (
          <span className="px-3">{rightSlot}</span>
        ) : null}
      </span>
      {error && (
        <span className="mt-1.5 block text-xs text-rose-600 dark:text-rose-400">
          {error}
        </span>
      )}
    </label>
  );
});

export default TextField;
