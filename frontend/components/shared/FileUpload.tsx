'use client';

import { Loader2, Upload, X } from 'lucide-react';
import Image from 'next/image';
import { type DragEvent, useEffect, useRef, useState } from 'react';
import { api } from '../../lib/api';
import * as Sentry from '@sentry/nextjs';

interface FileUploadProps {
  onUpload: (url: string) => void;
  accept?: string;
  label?: string;
  previewUrl?: string | null;
}

export function FileUpload({
  onUpload,
  accept = 'image/*',
  label = 'Upload file',
  previewUrl,
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState<string | null>(previewUrl ?? null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPreview(previewUrl ?? null);
  }, [previewUrl]);

  async function handleFile(file: File) {
    if (uploading) return;
    if (!file.type.startsWith('image/')) {
      setError('Only image files are allowed');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('File too large (max 10MB)');
      return;
    }
    setError(null);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await api.post('/upload', formData);
      setPreview(data.url);
      onUpload(data.url);
    } catch (err: unknown) {
      Sentry.captureException(err);
      const serverErr = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      const msg = serverErr ?? (err as { normalizedMessage?: string })?.normalizedMessage ?? (err instanceof Error ? err.message : 'Upload failed');
      setError(msg);
    } finally {
      setUploading(false);
    }
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  function onDragOver(e: DragEvent) {
    e.preventDefault();
    setDragOver(true);
  }
  function onDragLeave() {
    setDragOver(false);
  }

  function remove() {
    setPreview(null);
    onUpload('');
  }

  return (
    <div className="space-y-2">
      <label htmlFor="file-upload-input" className="block text-sm font-medium text-brand-text">
        {label}
      </label>

      {preview ? (
        <div className="relative inline-block">
          <Image
            src={preview}
            alt="Preview"
            width={128}
            height={128}
            className="h-32 w-32 rounded-xl object-cover border border-brand-border"
          />
          <button
            type="button"
            onClick={remove}
            aria-label="Remove file"
            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-brand-error text-white flex items-center justify-center hover:bg-brand-error/80 transition-colors active-bounce"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          aria-label="Upload file"
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
          className={`flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 border-dashed transition-colors active-bounce ${dragOver ? 'border-brand-primary bg-brand-primary/5' : 'border-brand-border hover:border-brand-primary/50 hover:bg-brand-bg'}`}
        >
          {uploading ? (
            <Loader2 className="w-6 h-6 animate-spin text-brand-primary" />
          ) : (
            <Upload className="w-6 h-6 text-brand-muted" />
          )}
          <p className="text-sm text-brand-muted">
            {uploading ? 'Uploading...' : 'Click or drag to upload'}
          </p>
          <p className="text-xs text-brand-muted/60">Max 10MB</p>
        </button>
      )}

      <input
        ref={inputRef}
        id="file-upload-input"
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />

      {error && <p className="text-sm text-brand-error">{error}</p>}
    </div>
  );
}
