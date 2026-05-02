'use client';

import { useState, useRef } from 'react';
import Button from '../ui/Button';

export default function AvatarUpload({ currentUrl, onSelect }) {
  const inputRef = useRef(null);
  const [preview, setPreview] = useState(null);

  const onFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 2 * 1024 * 1024) {
      alert('Avatar must be 2MB or smaller');
      return;
    }
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(f.type)) {
      alert('Only PNG, JPEG, or WebP allowed');
      return;
    }
    setPreview(URL.createObjectURL(f));
    onSelect(f);
  };

  const url = preview || currentUrl;

  return (
    <div className="flex items-center gap-4">
      <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="avatar" className="w-full h-full object-cover" />
        ) : (
          <span className="text-2xl">?</span>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={onFile}
      />
      <Button variant="secondary" onClick={() => inputRef.current?.click()}>
        {currentUrl ? 'Change avatar' : 'Upload avatar'}
      </Button>
    </div>
  );
}
