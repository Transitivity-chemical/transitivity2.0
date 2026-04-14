'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Download, FileText, Upload, Loader2, Folder, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { formatDateTime } from '@/lib/format-date';

type Role = 'INPUT' | 'OUTPUT' | 'ALL';

export interface GalleryFile {
  id: string;
  originalName: string;
  sizeBytes: number;
  fileType: string;
  resourceRole: 'INPUT' | 'OUTPUT';
  resourceType: string | null;
  resourceId: string | null;
  sha256: string | null;
  createdAt: string | Date;
}

interface Props {
  locale: string;
  initialFiles: GalleryFile[];
  initialTotalBytes: number;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export function FilesGallery({ locale, initialFiles, initialTotalBytes }: Props) {
  const [files, setFiles] = useState<GalleryFile[]>(initialFiles);
  const [totalBytes, setTotalBytes] = useState(initialTotalBytes);
  const [role, setRole] = useState<Role>('ALL');
  const [query, setQuery] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const refetch = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/files/list?limit=200', { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      setFiles(data.files ?? []);
      setTotalBytes(data.totalBytes ?? 0);
    } catch {
      /* swallow */
    }
  }, []);

  useEffect(() => {
    // Poll every 30s in case another tab uploaded
    const id = setInterval(refetch, 30_000);
    return () => clearInterval(id);
  }, [refetch]);

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/v1/files/upload', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      toast.success(`${file.name} enviado`);
      await refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Falha ao enviar');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const filtered = files.filter((f) => {
    if (role !== 'ALL' && f.resourceRole !== role) return false;
    if (query && !f.originalName.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  const inputs = files.filter((f) => f.resourceRole === 'INPUT').length;
  const outputs = files.filter((f) => f.resourceRole === 'OUTPUT').length;

  return (
    <div className="space-y-6">
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleUpload(f);
        }}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="rounded-md bg-primary/10 p-2.5 text-primary">
            <Folder className="size-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Arquivos · Files</h1>
            <p className="text-sm text-muted-foreground">
              Sua galeria de arquivos enviados e gerados pelos cálculos.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" disabled={uploading} onClick={() => fileInputRef.current?.click()}>
            {uploading ? <Loader2 className="mr-1.5 size-4 animate-spin" /> : <Upload className="mr-1.5 size-4" />}
            Enviar arquivo · Upload
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="shadow-sm">
          <CardContent className="py-4">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Total</p>
            <p className="mt-1 font-mono text-2xl font-semibold">{formatBytes(totalBytes)}</p>
            <p className="text-xs text-muted-foreground">{files.length} arquivos</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="py-4">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Inputs</p>
            <p className="mt-1 font-mono text-2xl font-semibold">{inputs}</p>
            <p className="text-xs text-muted-foreground">Enviados por você</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="py-4">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Outputs</p>
            <p className="mt-1 font-mono text-2xl font-semibold">{outputs}</p>
            <p className="text-xs text-muted-foreground">Gerados pelos cálculos</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filtrar por nome..."
          className="h-8 max-w-xs text-xs"
        />
        <div className="flex gap-1">
          {(['ALL', 'INPUT', 'OUTPUT'] as const).map((r) => (
            <Button
              key={r}
              size="sm"
              variant={role === r ? 'default' : 'outline'}
              onClick={() => setRole(r)}
              className="h-8 text-[11px]"
            >
              {r === 'ALL' ? 'Todos' : r}
            </Button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="py-16 text-center text-sm text-muted-foreground">
            Nenhum arquivo ainda. Clique em <span className="font-medium">Enviar arquivo</span> para começar.
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-sm">
          <CardContent className="p-0">
            <ul className="divide-y">
              {filtered.map((f) => (
                <li key={f.id}>
                  <div className="flex items-center gap-3 px-5 py-3 text-sm">
                    <FileText className="size-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{f.originalName}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {formatBytes(f.sizeBytes)} · {f.fileType}
                        {f.sha256 ? ` · ${f.sha256.slice(0, 8)}` : ''}
                        {f.resourceType ? ` · ${f.resourceType}` : ''}
                      </p>
                    </div>
                    <Badge variant={f.resourceRole === 'INPUT' ? 'outline' : 'secondary'} className="text-[10px]">
                      {f.resourceRole}
                    </Badge>
                    <span className="hidden w-40 text-right text-xs tabular-nums text-muted-foreground sm:inline">
                      {formatDateTime(f.createdAt, locale)}
                    </span>
                    <Link
                      href={`/api/v1/files/${f.id}/download`}
                      className="inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-[11px] font-medium hover:bg-accent"
                    >
                      <Download className="size-3" />
                      Baixar
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
