'use client';

import { WORKSPACE_ACCENT_PALETTE } from '@team-hub/shared';

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

export default function AccentColorPicker({ value, onChange }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Accent colour
      </label>
      <div className="grid grid-cols-6 gap-2">
        {WORKSPACE_ACCENT_PALETTE.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => onChange(c)}
            className={`h-8 w-8 rounded-md border transition-all ${
              value === c ? 'ring-2 ring-offset-2 ring-gray-900 dark:ring-white' : 'border-gray-300'
            }`}
            style={{ backgroundColor: c }}
            aria-label={`Use ${c}`}
          />
        ))}
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => HEX_RE.test(e.target.value) && onChange(e.target.value)}
        className="mt-2 block w-32 px-2 py-1 text-xs font-mono border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 dark:text-white"
        placeholder="#3b82f6"
      />
    </div>
  );
}
