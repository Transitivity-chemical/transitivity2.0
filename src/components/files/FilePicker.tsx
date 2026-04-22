'use client';

/**
 * FilePicker — modal gallery of the current user's bucket files.
 *
 * Two modes:
 *  1. Standalone — opens from a trigger button, lets the user pick OR upload.
 *  2. Embedded — rendered inline on a chemistry page so the user can pick
 *     a file already in their bucket instead of re-uploading.
 *
 * On pick, calls `onSelect(fileId, originalName)` and closes.
 * On upload, POSTs to `/api/v1/files/upload` then calls `onSelect` with the
 * new fileId.
 *
 * Reference: QuestionPunk gallery dialog pattern — tight list, preview, inline
 * upload slot at the top.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, Search, Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// Module-level cache so flipping between workbenches doesn't re-fetch the
// bucket every time. Keyed on roleFilter; 60 s TTL; revalidate in background
// on open. Invalidated manually after upload.
type CacheEntry = { files: BucketFile[]; fetchedAt: number };
const filesCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60_000;
function cacheKey(roleFilter: 'INPUT' | 'OUTPUT' | null): string {
  return roleFilter ?? 'ALL';
}
function invalidateFilesCache() {
  filesCache.clear();
}

export interface BucketFile {
  id: string;
  originalName: string;
  sizeBytes: number;
  fileType: string;
  resourceRole: 'INPUT' | 'OUTPUT';
  sha256: string | null;
  createdAt: string | Date;
}

interface FilePickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (file: BucketFile) => void;
  /** Only show files whose originalName matches this extension allowlist. */
  accept?: string[];
  /** Restrict to INPUT / OUTPUT / both. Default both. */
  roleFilter?: 'INPUT' | 'OUTPUT' | null;
  title?: string;
  description?: string;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function FilePicker({
  open,
  onOpenChange,
  onSelect,
  accept,
  roleFilter = null,
  title = 'Selecionar arquivo',
  description = 'Escolha da sua galeria ou envie um novo.',
}: FilePickerProps) {
  const cached = filesCache.get(cacheKey(roleFilter));
  const [files, setFiles] = useState<BucketFile[]>(cached?.files ?? []);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [filter, setFilter] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchFiles = useCallback(
    async ({ force = false }: { force?: boolean } = {}) => {
      const key = cacheKey(roleFilter);
      const entry = filesCache.get(key);
      const fresh = entry && Date.now() - entry.fetchedAt < CACHE_TTL_MS;
      if (entry) setFiles(entry.files);
      if (!force && fresh) return;
      // Only show the spinner when we have no cached data at all.
      if (!entry) setLoading(true);
      try {
        const url = new URL('/api/v1/files/list', window.location.origin);
        if (roleFilter) url.searchParams.set('role', roleFilter);
        url.searchParams.set('limit', '200');
        const res = await fetch(url.toString(), { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const list: BucketFile[] = data.files || [];
        filesCache.set(key, { files: list, fetchedAt: Date.now() });
        setFiles(list);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Falha ao carregar arquivos');
      } finally {
        setLoading(false);
      }
    },
    [roleFilter],
  );

  useEffect(() => {
    if (open) void fetchFiles();
  }, [open, fetchFiles]);

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/v1/files/upload', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      toast.success(`${file.name} enviado`);
      // Upload invalidates every role-scoped cache.
      invalidateFilesCache();
      await fetchFiles({ force: true });
      if (data.id) {
        const newFile: BucketFile = {
          id: data.id,
          originalName: data.originalName ?? file.name,
          sizeBytes: data.sizeBytes ?? file.size,
          fileType: data.fileType ?? 'OTHER',
          resourceRole: 'INPUT',
          sha256: data.sha256 ?? null,
          createdAt: new Date().toISOString(),
        };
        onSelect(newFile);
        onOpenChange(false);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Falha ao enviar');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Soft filter: show ALL files regardless of extension; users can still
  // pick anything. Matching extensions sort first so recommended files
  // surface at the top. Non-matching files are dimmed but selectable.
  const matchesAccept = (name: string): boolean => {
    if (!accept || accept.length === 0) return true;
    const ext = name.slice(name.lastIndexOf('.')).toLowerCase();
    return accept.includes(ext);
  };

  const visible = files
    .filter((f) => {
      if (filter && !f.originalName.toLowerCase().includes(filter.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      const aOk = matchesAccept(a.originalName) ? 0 : 1;
      const bOk = matchesAccept(b.originalName) ? 0 : 1;
      return aOk - bOk;
    });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'max-h-[85vh] w-[95vw] max-w-2xl overflow-hidden p-0 transition-colors',
          dragActive && 'ring-2 ring-primary ring-offset-2',
        )}
        onDragEnter={(e) => {
          if (e.dataTransfer.types.includes('Files')) {
            e.preventDefault();
            setDragActive(true);
          }
        }}
        onDragLeave={(e) => {
          if (e.currentTarget.contains(e.relatedTarget as Node)) return;
          setDragActive(false);
        }}
        onDragOver={(e) => {
          if (e.dataTransfer.types.includes('Files')) e.preventDefault();
        }}
        onDrop={(e) => {
          if (!e.dataTransfer.files?.length) return;
          e.preventDefault();
          setDragActive(false);
          void handleUpload(e.dataTransfer.files[0]);
        }}
      >
        <DialogHeader className="border-b px-5 py-4">
          <DialogTitle className="text-base">{title}</DialogTitle>
          <DialogDescription className="text-xs">{description}</DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2 border-b px-5 py-3">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filtrar por nome..."
              className="h-8 pl-8 text-xs"
            />
          </div>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept={accept?.join(',')}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleUpload(f);
            }}
          />
          <Button
            size="sm"
            variant="outline"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
          >
            {uploading ? (
              <Loader2 className="mr-1.5 size-3.5 animate-spin" />
            ) : (
              <Upload className="mr-1.5 size-3.5" />
            )}
            Enviar
          </Button>
        </div>

        <div className="h-[55vh] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
              <Loader2 className="mr-2 size-4 animate-spin" /> Carregando…
            </div>
          ) : visible.length === 0 ? (
            <div className="px-5 py-16 text-center text-sm text-muted-foreground">
              Nenhum arquivo encontrado. Clique em <span className="font-medium">Enviar</span> para começar.
            </div>
          ) : (
            <ul className="divide-y">
              {visible.map((f) => {
                const recommended = matchesAccept(f.originalName);
                return (
                <li key={f.id}>
                  <button
                    type="button"
                    className={cn(
                      'group flex w-full items-center gap-3 px-5 py-3 text-left text-sm transition hover:bg-accent/40',
                      !recommended && 'opacity-60',
                    )}
                    onClick={() => {
                      onSelect(f);
                      onOpenChange(false);
                    }}
                  >
                    <FileText className="size-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{f.originalName}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {formatBytes(f.sizeBytes)} · {f.fileType}
                        {f.sha256 ? ` · ${f.sha256.slice(0, 8)}` : ''}
                      </p>
                    </div>
                    <Badge variant={f.resourceRole === 'INPUT' ? 'outline' : 'secondary'} className="text-[10px]">
                      {f.resourceRole}
                    </Badge>
                    <Check className="size-4 text-primary opacity-0 transition group-hover:opacity-100" />
                  </button>
                </li>
                );
              })}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
