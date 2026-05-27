'use client';

import { useRef, useState } from 'react';
import Button from '../ui/Button';

export default function WorkspaceIconUpload({ workspace, onUpload }) {
  const [isUploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const handleFile = async (file) => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError('File must be 2 MB or smaller');
      return;
    }
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      setError('PNG, JPEG, or WebP only');
      return;
    }
    setError('');
    setUploading(true);
    try {
      await onUpload(file);
    } catch (err) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <div
        className="w-16 h-16 rounded-lg overflow-hidden flex items-center justify-center text-white font-semibold text-2xl"
        style={{ backgroundColor: workspace.accentColor }}
      >
        {workspace.iconUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={workspace.iconUrl}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          (workspace.name[0] || '?').toUpperCase()
        )}
      </div>
      <div>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        <Button
          variant="secondary"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
        >
          {isUploading
            ? 'Uploading…'
            : workspace.iconUrl
              ? 'Replace icon'
              : 'Upload icon'}
        </Button>
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </div>
    </div>
  );
}
