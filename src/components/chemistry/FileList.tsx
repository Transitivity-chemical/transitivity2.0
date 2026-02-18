'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Trash2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useDataLoader } from '@/hooks/useDataLoader';

interface FileItem {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  fileType: string;
  createdAt: string;
}

interface FileListResponse {
  files: FileItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const FILE_TYPE_COLORS: Record<string, 'default' | 'secondary' | 'outline'> = {
  GAUSSIAN_LOG: 'default',
  GAUSSIAN_OUT: 'default',
  GJF_INPUT: 'secondary',
  XYZ_GEOMETRY: 'secondary',
  RATE_DATA_TXT: 'outline',
  RATE_DATA_DAT: 'outline',
  RATE_DATA_CSV: 'outline',
  OTHER: 'outline',
};

export function FileList() {
  const t = useTranslations('files');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetcher = useCallback(async (): Promise<FileListResponse> => {
    const res = await fetch('/api/v1/files?limit=50');
    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(body.error || `Error ${res.status}`);
    }
    return res.json();
  }, []);

  const { data, loading, error, reload } = useDataLoader(fetcher);

  const handleDelete = async (id: string) => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/v1/files/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: 'Delete failed' }));
        throw new Error(body.error);
      }
      reload();
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setDeleting(false);
      setConfirmDeleteId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
        {t('loading')}
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8 text-center text-sm text-destructive">{error}</div>
    );
  }

  const files = data?.files ?? [];

  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-8 text-muted-foreground">
        <FileText className="size-8" />
        <p className="text-sm">{t('noFiles')}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-xs font-medium text-muted-foreground">
            <th className="pb-2 pr-4">{t('name')}</th>
            <th className="pb-2 pr-4">{t('size')}</th>
            <th className="pb-2 pr-4">{t('date')}</th>
            <th className="pb-2 pr-4">{t('type')}</th>
            <th className="pb-2" />
          </tr>
        </thead>
        <tbody>
          {files.map((file) => (
            <tr key={file.id} className="border-b last:border-0">
              <td className="py-2.5 pr-4 font-medium">{file.originalName}</td>
              <td className="py-2.5 pr-4 text-muted-foreground">
                {formatFileSize(file.sizeBytes)}
              </td>
              <td className="py-2.5 pr-4 text-muted-foreground">
                {formatDate(file.createdAt)}
              </td>
              <td className="py-2.5 pr-4">
                <Badge variant={FILE_TYPE_COLORS[file.fileType] ?? 'outline'}>
                  {file.fileType.replace(/_/g, ' ')}
                </Badge>
              </td>
              <td className="py-2.5 text-right">
                {confirmDeleteId === file.id ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{t('deleteConfirm')}</span>
                    <Button
                      variant="destructive"
                      size="xs"
                      disabled={deleting}
                      onClick={() => handleDelete(file.id)}
                    >
                      {t('confirmYes')}
                    </Button>
                    <Button
                      variant="outline"
                      size="xs"
                      disabled={deleting}
                      onClick={() => setConfirmDeleteId(null)}
                    >
                      {t('confirmNo')}
                    </Button>
                  </span>
                ) : (
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => setConfirmDeleteId(file.id)}
                  >
                    <Trash2 className="size-3.5 text-muted-foreground hover:text-destructive" />
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
