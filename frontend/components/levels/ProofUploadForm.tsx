'use client';

import { Loader2, Upload } from 'lucide-react';
import { type DragEvent, useRef, useState } from 'react';
import { api } from '../../lib/api';

interface ProofUploadFormProps {
  onFilesChange: (urls: string[]) => void;
}

export function ProofUploadForm({ onFilesChange }: ProofUploadFormProps) {
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState<{ url: string; name: string }[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (uploading) return;
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File exceeds 10MB limit');
      return;
    }
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      setUploadError('Only image files and PDFs are allowed');
      return;
    }
    setUploadError(null);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await api.post('/upload', formData);
      const newFiles = [...files, { url: data.url, name: file.name }];
      setFiles(newFiles);
      onFilesChange(newFiles.map((f) => f.url));
    } catch (err) {
      console.error('Proof upload failed:', err);
      const message =
        (err as { normalizedMessage?: string })?.normalizedMessage ??
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Upload failed. Please try again.';
      setUploadError(message);
    } finally {
      setUploading(false);
    }
  }

  function removeFile(url: string) {
    const newFiles = files.filter((f) => f.url !== url);
    setFiles(newFiles);
    onFilesChange(newFiles.map((f) => f.url));
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-brand-text">Upload Proof Documents</p>
      <p className="text-xs text-brand-muted">
        Add certificates, screenshots, or any supporting documents.
      </p>

      <button
        type="button"
        onDrop={onDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        className={`flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 border-dashed transition-colors cursor-pointer ${
          dragOver
            ? 'border-brand-primary bg-brand-primary/5'
            : 'border-brand-border hover:border-brand-primary/50 hover:bg-brand-bg'
        }`}
        onClick={() => inputRef.current?.click()}
        aria-label="Upload proof documents"
      >
        {uploading ? (
          <Loader2 className="w-6 h-6 animate-spin text-brand-primary" />
        ) : (
          <Upload className="w-6 h-6 text-brand-muted" />
        )}
        <p className="text-sm text-brand-muted">
          {uploading ? 'Uploading...' : 'Click or drag to upload'}
        </p>
        <p className="text-xs text-brand-muted/60">Max 10MB per file</p>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*,.pdf"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />

      {uploadError && <p className="text-sm text-destructive">{uploadError}</p>}

      {files.length > 0 && (
        <ul className="space-y-2">
          {files.map((f) => (
            <li
              key={f.url}
              className="flex items-center justify-between gap-2 p-2 rounded-lg bg-brand-bg border border-brand-border"
            >
              <span className="text-sm text-brand-text truncate">{f.name}</span>
              <button
                type="button"
                onClick={() => removeFile(f.url)}
                className="text-xs text-brand-error hover:underline cursor-pointer"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
