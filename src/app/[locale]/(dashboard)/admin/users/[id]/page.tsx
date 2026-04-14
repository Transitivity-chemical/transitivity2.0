import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isAdminRole } from '@/lib/access';
import { ArrowLeft, Download, FileText, Folder, Clock, FlaskConical, Atom, TrendingUp, Mail, Building2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDateTime } from '@/lib/format-date';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect(`/${locale}/login`);

  const admin = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (!admin || !isAdminRole(admin.role)) redirect(`/${locale}/dashboard`);

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      plan: true,
      credits: true,
      institution: true,
      isInstitutional: true,
      isActive: true,
      pendingApproval: true,
      lastLoginAt: true,
      createdAt: true,
    },
  });
  if (!user) notFound();

  const [files, reactions, mds, fits, usage] = await Promise.all([
    prisma.fileUpload.findMany({
      where: { userId: id },
      orderBy: { createdAt: 'desc' },
      take: 100,
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
    }),
    prisma.reaction.findMany({
      where: { userId: id },
      orderBy: { createdAt: 'desc' },
      take: 30,
      select: { id: true, name: true, status: true, createdAt: true },
    }),
    prisma.mDSimulation.findMany({
      where: { userId: id },
      orderBy: { createdAt: 'desc' },
      take: 30,
      select: { id: true, name: true, status: true, mdMethod: true, createdAt: true },
    }),
    prisma.fittingJob.findMany({
      where: { userId: id },
      orderBy: { createdAt: 'desc' },
      take: 30,
      select: { id: true, name: true, status: true, modelType: true, createdAt: true },
    }),
    prisma.usageRecord.findMany({
      where: { userId: id },
      orderBy: { createdAt: 'desc' },
      take: 30,
      select: { id: true, operation: true, tokensUsed: true, createdAt: true },
    }),
  ]);

  const totalBytes = files.reduce((s, f) => s + f.sizeBytes, 0);
  const totalCalcs = reactions.length + mds.length + fits.length;
  const creditsUsed = usage.reduce((s, u) => s + Number(u.tokensUsed), 0);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-8">
      <div>
        <Link
          href={`/${locale}/admin/users`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Voltar para usuários
        </Link>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{user.fullName}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Mail className="size-3.5" /> {user.email}
            </span>
            {user.institution && (
              <span className="inline-flex items-center gap-1">
                <Building2 className="size-3.5" /> {user.institution}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">{user.role}</Badge>
          <Badge variant="outline">{user.plan ?? 'Sem plano'}</Badge>
          <Badge variant={user.isActive ? 'secondary' : 'destructive'}>
            {user.isActive ? 'Ativo' : 'Inativo'}
          </Badge>
          {user.pendingApproval && <Badge variant="outline">Pendente aprovação</Badge>}
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid gap-3 sm:grid-cols-4">
        <StatCard label="Créditos disponíveis" value={Number(user.credits).toFixed(0)} />
        <StatCard label="Cálculos totais" value={totalCalcs.toString()} />
        <StatCard label="Créditos usados" value={creditsUsed.toFixed(0)} />
        <StatCard label="Arquivos" value={`${files.length} · ${formatBytes(totalBytes)}`} />
      </div>

      {/* Timeline: account info */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Informações da conta</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-3">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Criado em</p>
            <p className="tabular-nums">{formatDateTime(user.createdAt, locale)}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Último login</p>
            <p className="tabular-nums">
              {user.lastLoginAt ? formatDateTime(user.lastLoginAt, locale) : 'Nunca'}
            </p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Institucional</p>
            <p>{user.isInstitutional ? 'Sim' : 'Não'}</p>
          </div>
        </CardContent>
      </Card>

      {/* Files */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Folder className="size-4" />
            Arquivos ({files.length} · {formatBytes(totalBytes)})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {files.length === 0 ? (
            <p className="px-5 py-6 text-center text-xs text-muted-foreground">Nenhum arquivo.</p>
          ) : (
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
                      Baixar
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* History */}
      <div className="grid gap-4 lg:grid-cols-3">
        <HistoryCard title="Rate Constant" icon={FlaskConical} items={reactions.map((r) => ({ id: r.id, label: r.name, status: r.status, createdAt: r.createdAt }))} locale={locale} />
        <HistoryCard title="Molecular Dynamics" icon={Atom} items={mds.map((m) => ({ id: m.id, label: m.name ?? m.mdMethod, status: m.status, createdAt: m.createdAt }))} locale={locale} />
        <HistoryCard title="Fitting" icon={TrendingUp} items={fits.map((f) => ({ id: f.id, label: f.name ?? f.modelType, status: f.status, createdAt: f.createdAt }))} locale={locale} />
      </div>

      {/* Usage records */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Clock className="size-4" />
            Uso de créditos (últimas {usage.length} entradas)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {usage.length === 0 ? (
            <p className="px-5 py-6 text-center text-xs text-muted-foreground">Nenhum registro.</p>
          ) : (
            <ul className="max-h-80 divide-y overflow-y-auto">
              {usage.map((u) => (
                <li key={u.id} className="flex items-center justify-between px-5 py-2 text-xs">
                  <span className="font-mono">{u.operation}</span>
                  <span className="tabular-nums text-muted-foreground">
                    -{Number(u.tokensUsed).toFixed(2)} · {formatDateTime(u.createdAt, locale)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="shadow-sm">
      <CardContent className="py-4">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="mt-1 font-mono text-2xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}

function HistoryCard({
  title,
  icon: Icon,
  items,
  locale,
}: {
  title: string;
  icon: typeof FlaskConical;
  items: { id: string; label: string; status: string; createdAt: Date }[];
  locale: string;
}) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Icon className="size-4" />
          {title} ({items.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {items.length === 0 ? (
          <p className="px-5 py-6 text-center text-xs text-muted-foreground">Nenhum.</p>
        ) : (
          <ul className="max-h-60 divide-y overflow-y-auto">
            {items.map((it) => (
              <li key={it.id} className="flex items-center justify-between px-5 py-2 text-xs">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{it.label}</p>
                  <p className="text-[10px] text-muted-foreground">{formatDateTime(it.createdAt, locale)}</p>
                </div>
                <Badge variant="outline" className="ml-2 text-[9px]">
                  {it.status}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
