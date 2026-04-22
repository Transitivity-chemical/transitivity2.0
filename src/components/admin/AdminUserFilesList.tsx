'use client';

import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';
import { Download, FileText, Trash2, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useConfirm } from '@/components/providers/ConfirmDialogProvider';
import { formatDateTime } from '@/lib/format-date';
import { useRouter } from 'next/navigation';

type FileRow = {
  id: string;
  originalName: string;
  sizeBytes: number;
  fileType: string;
  resourceRole: 'INPUT' | 'OUTPUT';
  sha256: string | null;
  createdAt: Date | string;
};

interface Props {
  locale: string;
  initialFiles: FileRow[];
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export function AdminUserFilesList({ locale, initialFiles }: Props) {
  const [files, setFiles] = useState<FileRow[]>(initialFiles);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const confirm = useConfirm();
  const router = useRouter();

  const handleDelete = async (f: FileRow) => {
    const ok = await confirm({
      title: locale === 'pt-BR' ? 'Excluir arquivo do usuário?' : 'Delete user file?',
      description:
        locale === 'pt-BR'
          ? `"${f.originalName}" será removido do bucket. Esta ação é auditável.`
          : `"${f.originalName}" will be removed from the bucket. This action is auditable.`,
      confirmLabel: locale === 'pt-BR' ? 'Excluir' : 'Delete',
      variant: 'destructive',
    });
    if (!ok) return;
    setDeletingId(f.id);
    try {
      const res = await fetch(`/api/v1/files/${f.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      toast.success(locale === 'pt-BR' ? 'Arquivo excluído' : 'File deleted');
      setFiles((prev) => prev.filter((x) => x.id !== f.id));
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Falha ao excluir');
    } finally {
      setDeletingId(null);
    }
  };

  if (files.length === 0) {
    return (
      <p className="px-5 py-6 text-center text-xs text-muted-foreground">
        {locale === 'pt-BR' ? 'Nenhum arquivo.' : 'No files.'}
      </p>
    );
  }

  return (
    <ul className="max-h-96 divide-y overflow-y-auto">
      {files.map((f) => (
        <li key={f.id}>
          <div className="flex items-center gap-3 px-5 py-2 text-xs">
            <FileText className="size-3.5 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{f.originalName}</p>
              <p className="text-[10px] text-muted-foreground">
                {formatBytes(f.sizeBytes)} · {f.fileType}
                {f.sha256 ? ` · ${f.sha256.slice(0, 8)}` : ''}
              </p>
            </div>
            <Badge variant={f.resourceRole === 'INPUT' ? 'outline' : 'secondary'} className="text-[9px]">
              {f.resourceRole}
            </Badge>
            <span className="hidden w-36 text-right text-[10px] tabular-nums text-muted-foreground sm:inline">
              {formatDateTime(f.createdAt, locale)}
            </span>
            <Link
              href={`/api/v1/files/${f.id}/download`}
              className="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-medium hover:bg-accent"
            >
              <Download className="size-3" />
              {locale === 'pt-BR' ? 'Baixar' : 'Download'}
            </Link>
            <button
              type="button"
              onClick={() => handleDelete(f)}
              disabled={deletingId === f.id}
              className="inline-flex items-center gap-1 rounded-md border border-destructive/40 px-2 py-0.5 text-[10px] font-medium text-destructive hover:bg-destructive/10 disabled:opacity-50"
            >
              {deletingId === f.id ? <Loader2 className="size-3 animate-spin" /> : <Trash2 className="size-3" />}
              {locale === 'pt-BR' ? 'Excluir' : 'Delete'}
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
