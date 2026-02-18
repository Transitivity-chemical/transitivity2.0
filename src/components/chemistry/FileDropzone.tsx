'use client';

import { useState, useRef, useCallback, type DragEvent } from 'react';
import { useTranslations } from 'next-intl';
import { Upload, FileUp, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const ALLOWED_EXTENSIONS = '.log,.out,.gjf,.com,.xyz,.mol,.txt,.dat,.csv';

interface UploadedFile {
  id: string;
  filename: string;
  originalName: string;
  sizeBytes: number;
  fileType: string;
}

interface FileDropzoneProps {
  onUploadComplete?: (file: UploadedFile) => void;
  className?: string;
}

export function FileDropzone({ onUploadComplete, className }: FileDropzoneProps) {
  const t = useTranslations('files');
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = useCallback(
    async (file: File) => {
      setUploading(true);
      setProgress(0);
      setStatus('idle');
      setErrorMessage('');

      const formData = new FormData();
      formData.append('file', file);

      try {
        const xhr = new XMLHttpRequest();

        const result = await new Promise<UploadedFile>((resolve, reject) => {
          xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
              setProgress(Math.round((e.loaded / e.total) * 100));
            }
          });

          xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve(JSON.parse(xhr.responseText));
            } else {
              const body = JSON.parse(xhr.responseText);
              reject(new Error(body.error || `Upload failed (${xhr.status})`));
            }
          });

          xhr.addEventListener('error', () => {
            reject(new Error('Network error'));
          });

          xhr.open('POST', '/api/v1/files/upload');
          xhr.send(formData);
        });

        setStatus('success');
        setProgress(100);
        onUploadComplete?.(result);
      } catch (err) {
        setStatus('error');
        setErrorMessage(err instanceof Error ? err.message : t('uploadError'));
      } finally {
        setUploading(false);
      }
    },
    [onUploadComplete, t],
  );

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        handleUpload(file);
      }
    },
    [handleUpload],
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleUpload(file);
      }
      // Reset input so the same file can be selected again
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    },
    [handleUpload],
  );

  return (
    <div
      className={cn(
        'relative rounded-lg border-2 border-dashed p-8 text-center transition-colors',
        isDragging
          ? 'border-primary bg-primary/5'
          : 'border-muted-foreground/25 hover:border-muted-foreground/50',
        className,
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_EXTENSIONS}
        onChange={handleFileSelect}
        className="hidden"
      />

      {uploading ? (
        <div className="space-y-3">
          <FileUp className="mx-auto size-10 animate-pulse text-primary" />
          <p className="text-sm font-medium">{t('uploading')}</p>
          <div className="mx-auto h-2 w-48 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">{progress}%</p>
        </div>
      ) : status === 'success' ? (
        <div className="space-y-2">
          <CheckCircle className="mx-auto size-10 text-green-500" />
          <p className="text-sm font-medium text-green-600">{t('uploadSuccess')}</p>
        </div>
      ) : status === 'error' ? (
        <div className="space-y-2">
          <AlertCircle className="mx-auto size-10 text-destructive" />
          <p className="text-sm font-medium text-destructive">
            {errorMessage || t('uploadError')}
          </p>
          <Button variant="outline" size="sm" onClick={() => setStatus('idle')}>
            {t('tryAgain')}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <Upload className="mx-auto size-10 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">{t('dropzone')}</p>
            <Button
              variant="link"
              size="sm"
              className="mt-1"
              onClick={() => inputRef.current?.click()}
            >
              {t('browse')}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            {t('allowedExtensions', { extensions: ALLOWED_EXTENSIONS })}
          </p>
          <p className="text-xs text-muted-foreground">{t('maxSize')}</p>
        </div>
      )}
    </div>
  );
}
