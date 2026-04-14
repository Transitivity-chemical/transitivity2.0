'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, RefreshCw, KeyRound, Send, UserX, Globe, Copy, Check, X, Users } from 'lucide-react';
import { toast } from 'sonner';
import { useConfirm } from '@/components/providers/ConfirmDialogProvider';
import { DomainEditorModal } from './DomainEditorModal';

/**
 * Phase 6 of megaplan: full admin Users client component.
 *
 * Reference: docs/audit-questionpunk.md §3 (admin user-management UI patterns)
 *           docs/transitivity-overhaul-plan.md Phase 6
 */

type AdminUser = {
  id: string;
  email: string;
  fullName: string;
  role: 'USER' | 'ADMIN';
  plan: 'STUDENT' | 'PROFESSIONAL' | 'ENTERPRISE' | null;
  credits: number | string;
  isActive: boolean;
  pendingApproval: boolean;
  mustChangePassword: boolean;
  institution: string | null;
  isInstitutional: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  invitedAt: string | null;
};

type Pagination = { page: number; pageSize: number; total: number; totalPages: number };

type PendingRequest = {
  id: string;
  currentPlan: string | null;
  targetPlan: string;
  reason: string | null;
  createdAt: string;
  user: { id: string; email: string; fullName: string; plan: string | null };
};

interface Props {
  locale: string;
}

export function AdminUsersClient({ locale }: Props) {
  const t = useTranslations('admin');
  const tc = useTranslations('common');
  const confirm = useConfirm();
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [planFilter, setPlanFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [showDomainEditor, setShowDomainEditor] = useState(false);
  const [tempPasswordModal, setTempPasswordModal] = useState<null | {
    email: string;
    tempPassword: string;
    emailSent: boolean;
    emailProvider: string;
  }>(null);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (planFilter) params.set('plan', planFilter);
    if (roleFilter) params.set('role', roleFilter);
    if (statusFilter) params.set('status', statusFilter);
    params.set('page', String(page));
    const res = await fetch(`/api/v1/admin/users?${params.toString()}`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      setUsers(data.users || []);
      setPagination(data.pagination || null);
    }
    setLoading(false);
  }, [search, planFilter, roleFilter, statusFilter, page]);

  useEffect(() => {
    load();
  }, [load]);

  // Load pending plan requests
  const loadRequests = useCallback(async () => {
    const res = await fetch('/api/v1/admin/plan-requests?status=PENDING', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      setPendingRequests(data.requests || []);
    }
  }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const handleApproveRequest = async (id: string) => {
    const res = await fetch(`/api/v1/admin/plan-requests/${id}/approve`, { method: 'POST' });
    if (res.ok) {
      toast.success('Solicitação aprovada');
      loadRequests();
      load();
    } else {
      const data = await res.json();
      toast.error(data.error || 'Erro');
    }
  };

  const handleRejectRequest = async (id: string) => {
    const ok = await confirm({
      title: 'Rejeitar solicitação?',
      description: 'O usuário será notificado.',
      confirmLabel: 'Rejeitar',
      variant: 'destructive',
    });
    if (!ok) return;
    const res = await fetch(`/api/v1/admin/plan-requests/${id}/reject`, { method: 'POST' });
    if (res.ok) {
      toast.success('Solicitação rejeitada');
      loadRequests();
    } else {
      const data = await res.json();
      toast.error(data.error || 'Erro');
    }
  };

  const handleCreate = async (form: { email: string; fullName: string; plan: string; role: string }) => {
    const res = await fetch('/api/v1/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || 'Erro ao criar usuário');
      return;
    }
    setShowAdd(false);
    setTempPasswordModal({
      email: data.user.email,
      tempPassword: data.tempPassword,
      emailSent: data.email?.sent ?? false,
      emailProvider: data.email?.provider ?? 'console',
    });
    toast.success(`Usuário ${data.user.email} criado`);
    load();
  };

  const handleApproveUser = async (id: string, email: string) => {
    const res = await fetch(`/api/v1/admin/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pendingApproval: false,
        plan: 'STUDENT',
        // Backend auto-refills credits when plan changes and credits is undefined
      }),
    });
    if (res.ok) {
      toast.success(`${email} aprovado como Estudante`);
      load();
    } else {
      const data = await res.json();
      toast.error(data.error || 'Erro ao aprovar');
    }
  };

  const handleResetTempPassword = async (id: string, email: string) => {
    const ok = await confirm({
      title: 'Redefinir senha temporária?',
      description: t('confirmResetTempPassword'),
      confirmLabel: 'Redefinir',
    });
    if (!ok) return;
    const res = await fetch(`/api/v1/admin/users/${id}/reset-temp-password`, { method: 'POST' });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || 'Erro');
      return;
    }
    setTempPasswordModal({
      email,
      tempPassword: data.tempPassword,
      emailSent: data.email?.sent ?? false,
      emailProvider: data.email?.provider ?? 'console',
    });
  };

  const handleResendInvite = async (id: string, email: string) => {
    const res = await fetch(`/api/v1/admin/users/${id}/resend-invite`, { method: 'POST' });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || 'Erro');
      return;
    }
    setTempPasswordModal({
      email,
      tempPassword: data.tempPassword,
      emailSent: data.email?.sent ?? false,
      emailProvider: data.email?.provider ?? 'console',
    });
  };

  const handleDeactivate = async (id: string) => {
    const ok = await confirm({
      title: 'Desativar usuário?',
      description: t('confirmDeactivate'),
      confirmLabel: 'Desativar',
      variant: 'destructive',
    });
    if (!ok) return;
    const res = await fetch(`/api/v1/admin/users/${id}`, { method: 'DELETE' });
    if (res.ok) {
      toast.success('Usuário desativado');
      load();
    } else {
      toast.error('Erro ao desativar');
    }
  };

  const handleSaveEdit = async (id: string, patch: Partial<AdminUser>) => {
    const res = await fetch(`/api/v1/admin/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    if (res.ok) {
      setEditingUser(null);
      load();
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2.5 text-primary">
            <Users className="size-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('users.title')}</h1>
            <p className="text-sm text-muted-foreground">{t('users.description')}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowDomainEditor(true)}>
            <Globe className="mr-2 h-4 w-4" />
            {t('users.manageDomains')}
          </Button>
          <Button onClick={() => setShowAdd(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t('users.addUser')}
          </Button>
        </div>
      </div>

      {pendingRequests.length > 0 && (
        <div className="mb-6 rounded-lg border border-border/70 bg-card/40 p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold tracking-tight">Solicitações pendentes</h2>
            <span className="text-xs text-muted-foreground">{pendingRequests.length}</span>
          </div>
          <ul className="space-y-2">
            {pendingRequests.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border/70 bg-background/80 px-3 py-2 text-sm shadow-sm"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium truncate">{r.user.fullName}</span>
                    <span className="text-xs text-muted-foreground">({r.user.email})</span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Mudar de <strong>{r.currentPlan ?? '—'}</strong> para <strong>{r.targetPlan}</strong>
                    <span className="ml-2 text-muted-foreground/80">{new Date(r.createdAt).toLocaleString(locale)}</span>
                  </p>
                  {r.reason && <p className="mt-1 text-xs italic text-muted-foreground">&ldquo;{r.reason}&rdquo;</p>}
                </div>
                <div className="flex flex-shrink-0 gap-1">
                  <Button size="sm" variant="default" onClick={() => handleApproveRequest(r.id)}>
                    <Check className="mr-1 h-3.5 w-3.5" />
                    Aprovar
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleRejectRequest(r.id)}>
                    <X className="mr-1 h-3.5 w-3.5" />
                    Rejeitar
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('users.searchPlaceholder')}
            className="pl-9 w-72"
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
          />
        </div>
        <select className="rounded-md border bg-background px-3 text-sm" value={planFilter} onChange={(e) => { setPage(1); setPlanFilter(e.target.value); }}>
          <option value="">{t('users.allPlans')}</option>
          <option value="STUDENT">{t('plans.student')}</option>
          <option value="PROFESSIONAL">{t('plans.professional')}</option>
          <option value="ENTERPRISE">{t('plans.enterprise')}</option>
        </select>
        <select className="rounded-md border bg-background px-3 text-sm" value={roleFilter} onChange={(e) => { setPage(1); setRoleFilter(e.target.value); }}>
          <option value="">{t('users.allRoles')}</option>
          <option value="USER">Usuário</option>
          <option value="ADMIN">Admin</option>
        </select>
        <select className="rounded-md border bg-background px-3 text-sm" value={statusFilter} onChange={(e) => { setPage(1); setStatusFilter(e.target.value); }}>
          <option value="">{t('users.allStatuses')}</option>
          <option value="active">{t('users.active')}</option>
          <option value="pending">{t('users.pending')}</option>
          <option value="inactive">{t('users.inactive')}</option>
        </select>
        <Button variant="outline" size="sm" onClick={load}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <div className="rounded-lg border border-border/70 bg-card/30 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left">
            <tr>
              <th className="px-3 py-2 font-medium">{t('users.col.user')}</th>
              <th className="px-3 py-2 font-medium">{t('users.col.role')}</th>
              <th className="px-3 py-2 font-medium">{t('users.col.plan')}</th>
              <th className="px-3 py-2 font-medium">{t('users.col.credits')}</th>
              <th className="px-3 py-2 font-medium">{t('users.col.status')}</th>
              <th className="px-3 py-2 font-medium">{t('users.col.lastLogin')}</th>
              <th className="px-3 py-2 font-medium">{t('users.col.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-muted-foreground">{tc('loading')}</td>
              </tr>
            )}
            {!loading && users.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-muted-foreground">{tc('noResults')}</td>
              </tr>
            )}
            {!loading && users.map((u) => (
              <tr key={u.id} className="border-t hover:bg-muted/20">
                <td className="px-3 py-2">
                  <div className="font-medium">{u.fullName}</div>
                  <div className="text-xs text-muted-foreground">{u.email}</div>
                </td>
                <td className="px-3 py-2"><Badge variant={u.role === 'ADMIN' ? 'default' : 'secondary'}>{u.role}</Badge></td>
                <td className="px-3 py-2">
                  {u.plan ? <Badge variant="outline">{u.plan}</Badge> : <span className="text-xs text-muted-foreground">—</span>}
                </td>
                <td className="px-3 py-2 tabular-nums">{Number(u.credits).toFixed(0)}</td>
                <td className="px-3 py-2">
                  {!u.isActive ? <Badge variant="destructive">{t('users.inactive')}</Badge>
                    : u.pendingApproval ? <Badge variant="outline">{t('users.pending')}</Badge>
                    : u.mustChangePassword ? <Badge variant="outline">{t('users.firstLogin')}</Badge>
                    : <Badge variant="secondary">{t('users.active')}</Badge>}
                </td>
                <td className="px-3 py-2 text-xs text-muted-foreground">
                  {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString(locale) : '—'}
                </td>
                <td className="px-3 py-2">
                  <div className="flex gap-1 items-center">
                    {u.pendingApproval && (
                      <Button
                        size="sm"
                        variant="default"
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => handleApproveUser(u.id, u.email)}
                      >
                        <Check className="h-3.5 w-3.5 mr-1" />
                        Aprovar
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" title={t('users.editAction')} onClick={() => setEditingUser(u)}>
                      Edit
                    </Button>
                    {!u.lastLoginAt && (
                      <Button size="sm" variant="ghost" title={t('users.resendInvite')} onClick={() => handleResendInvite(u.id, u.email)}>
                        <Send className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" title={t('users.resetTempPassword')} onClick={() => handleResetTempPassword(u.id, u.email)}>
                      <KeyRound className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" title={t('users.deactivate')} onClick={() => handleDeactivate(u.id)}>
                      <UserX className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <span>{t('users.pageOf', { page: pagination.page, total: pagination.totalPages })}</span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>‹</Button>
            <Button size="sm" variant="outline" disabled={page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)}>›</Button>
          </div>
        </div>
      )}

      {showAdd && <AddUserModal onClose={() => setShowAdd(false)} onCreate={handleCreate} />}
      {tempPasswordModal && (
        <TempPasswordModal data={tempPasswordModal} onClose={() => setTempPasswordModal(null)} />
      )}
      {editingUser && <EditUserModal user={editingUser} onClose={() => setEditingUser(null)} onSave={handleSaveEdit} />}
      {showDomainEditor && <DomainEditorModal onClose={() => setShowDomainEditor(false)} />}
    </div>
  );
}

// ───────────────────────────────────────────────────────
// Sub-components
// ───────────────────────────────────────────────────────

function AddUserModal({ onClose, onCreate }: { onClose: () => void; onCreate: (form: { email: string; fullName: string; plan: string; role: string }) => void }) {
  const t = useTranslations('admin');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [plan, setPlan] = useState('STUDENT');
  const [role, setRole] = useState('USER');

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('users.addUser')}</DialogTitle>
          <DialogDescription>
            O sistema vai gerar uma senha temporária e enviar por email.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onCreate({ email, fullName, plan, role });
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium mb-1">{t('users.col.user')}</label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required minLength={2} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('users.col.plan')}</label>
            <select className="w-full rounded-md border bg-background px-3 py-2 text-sm" value={plan} onChange={(e) => setPlan(e.target.value)}>
              <option value="STUDENT">Student</option>
              <option value="PROFESSIONAL">Professional</option>
              <option value="ENTERPRISE">Enterprise</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('users.col.role')}</label>
            <select className="w-full rounded-md border bg-background px-3 py-2 text-sm" value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="USER">Usuário</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit">{t('users.create')}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function TempPasswordModal({
  data,
  onClose,
}: {
  data: { email: string; tempPassword: string; emailSent: boolean; emailProvider: string };
  onClose: () => void;
}) {
  const t = useTranslations('admin');
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(data.tempPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('tempPasswordModal.title')}</DialogTitle>
          <DialogDescription>{t('tempPasswordModal.warning')}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Email</p>
            <p className="font-mono text-sm">{data.email}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">{t('tempPasswordModal.password')}</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-3 py-2 font-mono text-sm break-all">
                {data.tempPassword}
              </code>
              <Button size="sm" variant="outline" onClick={copy}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <div className="rounded-lg border border-border/70 p-3 text-sm shadow-sm">
            <p className={data.emailSent ? 'text-green-700 dark:text-green-400' : 'text-amber-700 dark:text-amber-400'}>
              {data.emailSent
                ? `${t('tempPasswordModal.emailSent')} (${data.emailProvider})`
                : `${t('tempPasswordModal.emailNotSent')} (${data.emailProvider})`}
            </p>
          </div>
          <p className="text-xs text-amber-700 dark:text-amber-400">{t('tempPasswordModal.warning')}</p>
        </div>
        <DialogFooter>
          <Button onClick={onClose}>{t('tempPasswordModal.close')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditUserModal({
  user,
  onClose,
  onSave,
}: {
  user: AdminUser;
  onClose: () => void;
  onSave: (id: string, patch: Partial<AdminUser>) => void;
}) {
  const t = useTranslations('admin');
  const [fullName, setFullName] = useState(user.fullName);
  const [role, setRole] = useState(user.role);
  const [plan, setPlan] = useState<string>(user.plan ?? '');
  const [credits, setCredits] = useState(String(user.credits));

  // Default credit caps per plan — mirrors backend PlanConfig seeds.
  // When the admin picks a plan, we auto-fill the credits to this value
  // (admin can still override before submitting).
  const PLAN_CREDITS: Record<string, number> = {
    STUDENT: 100,
    PROFESSIONAL: 1000,
    ENTERPRISE: 999999,
  };

  const handlePlanChange = (newPlan: string) => {
    setPlan(newPlan);
    if (newPlan && PLAN_CREDITS[newPlan] !== undefined) {
      setCredits(String(PLAN_CREDITS[newPlan]));
    } else if (!newPlan) {
      setCredits('0');
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('users.editTitle', { name: user.fullName })}</DialogTitle>
          <DialogDescription>Edite papel, plano e créditos. Mudar o plano preenche os créditos automaticamente.</DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSave(user.id, {
              fullName,
              role: role as AdminUser['role'],
              plan: (plan || null) as AdminUser['plan'],
              credits: Number(credits),
            });
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium mb-1">{t('users.col.user')}</label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('users.col.role')}</label>
            <select className="w-full rounded-md border bg-background px-3 py-2 text-sm" value={role} onChange={(e) => setRole(e.target.value as AdminUser['role'])}>
              <option value="USER">Usuário</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('users.col.plan')}</label>
            <select className="w-full rounded-md border bg-background px-3 py-2 text-sm" value={plan} onChange={(e) => handlePlanChange(e.target.value)}>
              <option value="">— (no plan)</option>
              <option value="STUDENT">Student (100 créditos)</option>
              <option value="PROFESSIONAL">Professional (1000 créditos)</option>
              <option value="ENTERPRISE">Enterprise (ilimitado)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('users.col.credits')}</label>
            <Input type="number" value={credits} onChange={(e) => setCredits(e.target.value)} min={0} />
            <p className="text-[10px] text-muted-foreground mt-1">Auto-preenchido pelo plano. Você pode ajustar manualmente.</p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit">Salvar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
