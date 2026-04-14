'use client';

import Link from 'next/link';
import { Download, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export interface ResourceFile {
  id: string;
  originalName: string;
  sizeBytes: number;
  resourceRole: 'INPUT' | 'OUTPUT';
  sha256?: string | null;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function ResourceFilesList({ files }: { files: ResourceFile[] }) {
  if (files.length === 0) return null;
  const inputs = files.filter((f) => f.resourceRole === 'INPUT');
  const outputs = files.filter((f) => f.resourceRole === 'OUTPUT');

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">
          Arquivos utilizados · Files used
          <span className="ml-2 text-xs font-normal text-muted-foreground">
            {inputs.length} inputs · {outputs.length} outputs
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ul className="divide-y">
          {files.map((f) => (
            <li key={f.id}>
              <div className="flex items-center gap-3 px-5 py-3 text-sm">
                <FileText className="size-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{f.originalName}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {formatBytes(f.sizeBytes)}
                    {f.sha256 ? ` · ${f.sha256.slice(0, 8)}` : ''}
                  </p>
                </div>
                <Badge variant={f.resourceRole === 'INPUT' ? 'outline' : 'secondary'} className="text-[10px]">
                  {f.resourceRole}
                </Badge>
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
  );
}
