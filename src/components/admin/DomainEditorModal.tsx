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
import { Trash2, Plus } from 'lucide-react';

/**
 * Phase 7 of megaplan: editable email-domain allowlist modal.
 *
 * Reference: docs/transitivity-overhaul-plan.md Phase 7
 */

type Domain = {
  id: string;
  domain: string;
  institution: string;
  country: string;
  isVerified: boolean;
  defaultPlan: 'STUDENT' | 'PROFESSIONAL' | 'ENTERPRISE';
};

export function DomainEditorModal({ onClose }: { onClose: () => void }) {
  const t = useTranslations('admin');
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [newDomain, setNewDomain] = useState('');
  const [newInstitution, setNewInstitution] = useState('');
  const [newPlan, setNewPlan] = useState<'STUDENT' | 'PROFESSIONAL' | 'ENTERPRISE'>('STUDENT');

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/v1/admin/domains');
    if (res.ok) {
      const data = await res.json();
      setDomains(data.domains || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleAdd = async () => {
    if (!newDomain.trim() || !newInstitution.trim()) return;
    const res = await fetch('/api/v1/admin/domains', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        domain: newDomain.trim().toLowerCase(),
        institution: newInstitution.trim(),
        defaultPlan: newPlan,
      }),
    });
    if (res.ok) {
      setNewDomain('');
      setNewInstitution('');
      load();
    } else {
      const data = await res.json();
      alert(data.error || 'Erro');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('domains.confirmDelete'))) return;
    const res = await fetch(`/api/v1/admin/domains/${id}`, { method: 'DELETE' });
    if (res.ok) load();
  };

  const handlePatchPlan = async (id: string, plan: Domain['defaultPlan']) => {
    const res = await fetch(`/api/v1/admin/domains/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ defaultPlan: plan }),
    });
    if (res.ok) load();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('domains.title')}</DialogTitle>
          <DialogDescription>{t('domains.description')}</DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border overflow-hidden mb-4">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left">
              <tr>
                <th className="px-3 py-2 font-medium">{t('domains.col.domain')}</th>
                <th className="px-3 py-2 font-medium">{t('domains.col.institution')}</th>
                <th className="px-3 py-2 font-medium">{t('domains.col.defaultPlan')}</th>
                <th className="px-3 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-center text-muted-foreground">...</td>
                </tr>
              )}
              {!loading && domains.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-center text-muted-foreground">
                    {t('domains.empty')}
                  </td>
                </tr>
              )}
              {!loading &&
                domains.map((d) => (
                  <tr key={d.id} className="border-t">
                    <td className="px-3 py-2 font-mono text-xs">@{d.domain}</td>
                    <td className="px-3 py-2">{d.institution}</td>
                    <td className="px-3 py-2">
                      <select
                        className="rounded-md border bg-background px-2 py-1 text-xs"
                        value={d.defaultPlan}
                        onChange={(e) => handlePatchPlan(d.id, e.target.value as Domain['defaultPlan'])}
                      >
                        <option value="STUDENT">Student</option>
                        <option value="PROFESSIONAL">Professional</option>
                        <option value="ENTERPRISE">Enterprise</option>
                      </select>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(d.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        <div className="rounded-lg border p-4 space-y-3">
          <h3 className="text-sm font-semibold">{t('domains.addNew')}</h3>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-xs text-muted-foreground mb-1">{t('domains.col.domain')}</label>
              <Input
                placeholder="aluno.unb.br"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-muted-foreground mb-1">{t('domains.col.institution')}</label>
              <Input
                placeholder="Universidade de Brasília"
                value={newInstitution}
                onChange={(e) => setNewInstitution(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">{t('domains.col.defaultPlan')}</label>
              <select
                className="rounded-md border bg-background px-3 py-2 text-sm"
                value={newPlan}
                onChange={(e) => setNewPlan(e.target.value as Domain['defaultPlan'])}
              >
                <option value="STUDENT">Student</option>
                <option value="PROFESSIONAL">Professional</option>
                <option value="ENTERPRISE">Enterprise</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button onClick={handleAdd}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onClose}>{t('domains.close')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
