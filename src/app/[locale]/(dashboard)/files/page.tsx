import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Folder, Download, FileText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDateTime } from '@/lib/format-date';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export default async function FilesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect(`/${locale}/login`);

  const files = await prisma.fileUpload.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: 200,
    select: {
      id: true,
      originalName: true,
      sizeBytes: true,
      fileType: true,
      resourceRole: true,
      resourceType: true,
      sha256: true,
      createdAt: true,
    },
  });

  const totalBytes = files.reduce((sum, f) => sum + f.sizeBytes, 0);
  const inputs = files.filter((f) => f.resourceRole === 'INPUT');
  const outputs = files.filter((f) => f.resourceRole === 'OUTPUT');

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-8">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="rounded-md bg-primary/10 p-2.5 text-primary">
            <Folder className="size-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Arquivos · Files</h1>
            <p className="text-sm text-muted-foreground">
              Todos os arquivos que você enviou e os resultados gerados pelos cálculos.
            </p>
          </div>
        </div>
        <div className="text-right text-xs text-muted-foreground">
          <p className="font-mono text-sm text-foreground">{formatBytes(totalBytes)}</p>
          <p>{files.length} arquivos</p>
          <p className="text-[10px]">{inputs.length} inputs · {outputs.length} outputs</p>
        </div>
      </div>

      {files.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Nenhum arquivo enviado ainda.
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-sm">
          <CardContent className="p-0">
            <ul className="divide-y">
              {files.map((f) => (
                <li key={f.id}>
                  <div className="flex items-center gap-3 px-5 py-3 text-sm">
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
