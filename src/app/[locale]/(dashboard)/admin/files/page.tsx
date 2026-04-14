import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isAdminRole } from '@/lib/access';
import { FolderSearch, Download } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDateTime } from '@/lib/format-date';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export default async function AdminFilesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ user?: string }>;
}) {
  const { locale } = await params;
  const { user: filterUser } = await searchParams;
  const session = await auth();
  if (!session?.user?.id) redirect(`/${locale}/login`);

  const adminRecord = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (!adminRecord || !isAdminRole(adminRecord.role)) {
    redirect(`/${locale}/dashboard`);
  }

  const files = await prisma.fileUpload.findMany({
    where: filterUser ? { userId: filterUser } : {},
    orderBy: { createdAt: 'desc' },
    take: 300,
    select: {
      id: true,
      originalName: true,
      sizeBytes: true,
      fileType: true,
      resourceRole: true,
      resourceType: true,
      createdAt: true,
      user: { select: { id: true, email: true, fullName: true } },
    },
  });

  const totalBytes = files.reduce((s, f) => s + f.sizeBytes, 0);

  // Group by user for summary
  const byUser = new Map<string, { email: string; fullName: string; bytes: number; count: number }>();
  for (const f of files) {
    const k = f.user.id;
    const entry = byUser.get(k) || { email: f.user.email, fullName: f.user.fullName, bytes: 0, count: 0 };
    entry.bytes += f.sizeBytes;
    entry.count += 1;
    byUser.set(k, entry);
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-8">
      <div className="flex items-center gap-3">
        <div className="rounded-md bg-primary/10 p-2.5 text-primary">
          <FolderSearch className="size-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Arquivos (Admin)</h1>
          <p className="text-sm text-muted-foreground">
            Todos os arquivos enviados e gerados pelos usuários. {formatBytes(totalBytes)} · {files.length} arquivos.
          </p>
        </div>
      </div>

      {filterUser && (
        <div className="rounded-md border bg-muted/40 px-4 py-2 text-xs">
          Filtrado por usuário <span className="font-mono">{filterUser}</span>.{' '}
          <Link href={`/${locale}/admin/files`} className="text-primary hover:underline">
            Limpar filtro
          </Link>
        </div>
      )}

      {byUser.size > 1 && !filterUser && (
        <Card className="shadow-sm">
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground/80">
                <tr>
                  <th className="px-4 py-2 font-medium">Usuário</th>
                  <th className="px-4 py-2 font-medium">Arquivos</th>
                  <th className="px-4 py-2 font-medium">Tamanho</th>
                  <th className="px-4 py-2 font-medium" />
                </tr>
              </thead>
              <tbody>
                {[...byUser.entries()]
                  .sort((a, b) => b[1].bytes - a[1].bytes)
                  .map(([uid, v]) => (
                    <tr key={uid} className="border-t">
                      <td className="px-4 py-2">
                        <p className="font-medium">{v.fullName}</p>
                        <p className="text-[11px] text-muted-foreground">{v.email}</p>
                      </td>
                      <td className="px-4 py-2 tabular-nums">{v.count}</td>
                      <td className="px-4 py-2 font-mono tabular-nums">{formatBytes(v.bytes)}</td>
                      <td className="px-4 py-2 text-right">
                        <Link
                          href={`/${locale}/admin/files?user=${uid}`}
                          className="text-xs text-primary hover:underline"
                        >
                          Ver todos
                        </Link>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      <Card className="shadow-sm">
        <CardContent className="p-0">
          <ul className="divide-y">
            {files.map((f) => (
              <li key={f.id}>
                <div className="flex items-center gap-3 px-5 py-3 text-sm">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{f.originalName}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {f.user.fullName} · {f.user.email} · {formatBytes(f.sizeBytes)} · {f.fileType}
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
    </div>
  );
}
