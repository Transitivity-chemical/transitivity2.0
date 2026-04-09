'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useConfirm } from '@/components/providers/ConfirmDialogProvider';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Download,
  FileText,
  ArrowLeft,
  Trash2,
  Copy,
  Check,
} from 'lucide-react';

interface GeneratedFile {
  id: string;
  fileType: string;
  filename: string;
  content: string;
  createdAt: string;
}

interface Atom {
  id: string;
  atomIndex: number;
  element: string;
  x: number;
  y: number;
  z: number;
}

interface Molecule {
  id: string;
  label: string | null;
  nAtoms: number | null;
  atoms: Atom[];
}

interface Simulation {
  id: string;
  name: string | null;
  mdMethod: string;
  status: string;
  dftFunctional: string | null;
  charge: number;
  lsdFlag: number;
  temperature: number | null;
  maxSteps: number | null;
  timeStep: number | null;
  latticeA: number | null;
  latticeB: number | null;
  latticeC: number | null;
  cutoff?: number | null;
  emass?: number | null;
  createdAt: string;
  inputMolecules: Molecule[];
  generatedFiles: GeneratedFile[];
}

interface Props {
  simulation: Simulation;
  locale: string;
}

const FILE_TYPE_LABELS: Record<string, string> = {
  RUN_INPUT: 'Dynamics Input',
  WAVEFUNCTION_INPUT: 'Wavefunction Optimization',
  GAUSSVIEW_CHECK: 'GaussView Check',
  XYZ_TRAJECTORY: 'XYZ Trajectory',
};

export function MDResult({ simulation, locale }: Props) {
  const t = useTranslations('md');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const confirmDialog = useConfirm();
  const [activeTab, setActiveTab] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const files = simulation.generatedFiles;

  const downloadFile = (file: GeneratedFile) => {
    const blob = new Blob([file.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadAll = () => {
    // Download each file individually (zip would require a library)
    files.forEach((f) => downloadFile(f));
  };

  const copyContent = async (file: GeneratedFile) => {
    await navigator.clipboard.writeText(file.content);
    setCopiedId(file.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async () => {
    const ok = await confirmDialog({
      title: 'Excluir simulação?',
      description: t('deleteConfirm'),
      confirmLabel: 'Excluir',
      variant: 'destructive',
    });
    if (!ok) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/v1/md/${simulation.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        toast.success('Simulação excluída');
        router.push(`/${locale}/md/list`);
      } else {
        toast.error('Erro ao excluir');
      }
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-5xl mx-auto">
      {/* Breadcrumb / back link */}
      <button
        type="button"
        onClick={() => router.push(`/${locale}/md/list`)}
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3" />
        Voltar para todas as simulações
      </button>

      {/* Hero header */}
      <div className="rounded-2xl border bg-gradient-to-br from-primary/5 to-background p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="default">{simulation.mdMethod}</Badge>
              <Badge variant="secondary">{simulation.status}</Badge>
            </div>
            <h1 className="text-2xl font-bold tracking-tight truncate">
              {simulation.name || `${simulation.mdMethod} Simulation`}
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">
              Criado em {new Date(simulation.createdAt).toLocaleString(locale)}
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            {files.length > 1 && (
              <Button variant="outline" size="sm" onClick={downloadAll}>
                <Download className="mr-1.5 size-4" />
                Baixar todos
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              disabled={deleting}
              onClick={handleDelete}
              className="text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30"
            >
              <Trash2 className="mr-1.5 size-4" />
              Excluir
            </Button>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MiniStat label={t('method')} value={simulation.mdMethod} />
        {simulation.dftFunctional && <MiniStat label={t('functional')} value={simulation.dftFunctional} />}
        {simulation.temperature != null && <MiniStat label={t('temperature')} value={`${simulation.temperature} K`} />}
        {simulation.maxSteps != null && <MiniStat label={t('maxSteps')} value={simulation.maxSteps.toLocaleString()} />}
        <MiniStat label={t('charge')} value={String(simulation.charge)} />
        {simulation.inputMolecules[0] && (
          <MiniStat label={t('atoms')} value={String(simulation.inputMolecules[0].atoms.length)} />
        )}
        {simulation.timeStep != null && <MiniStat label={t('timeStep')} value={`${simulation.timeStep} a.u.`} />}
        <MiniStat
          label="Lattice"
          value={`${simulation.latticeA?.toFixed(1) ?? '–'} × ${simulation.latticeB?.toFixed(1) ?? '–'} × ${simulation.latticeC?.toFixed(1) ?? '–'}`}
        />
      </div>

      {/* File tabs + content */}
      {files.length > 0 && (
        <Card>
          <CardHeader className="pb-0">
            <div className="flex flex-wrap gap-1 border-b">
              {files.map((file, idx) => (
                <button
                  key={file.id}
                  onClick={() => setActiveTab(idx)}
                  className={`flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === idx
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <FileText className="size-4" />
                  {FILE_TYPE_LABELS[file.fileType] || file.filename}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {files[activeTab] && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">
                    {files[activeTab].filename}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyContent(files[activeTab])}
                    >
                      {copiedId === files[activeTab].id ? (
                        <>
                          <Check className="mr-1 size-3" />
                          {t('copied')}
                        </>
                      ) : (
                        <>
                          <Copy className="mr-1 size-3" />
                          {t('copy')}
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadFile(files[activeTab])}
                    >
                      <Download className="mr-1 size-3" />
                      {tCommon('download')}
                    </Button>
                  </div>
                </div>

                <div className="max-h-[500px] overflow-auto rounded-md border bg-zinc-950 dark:bg-zinc-900 p-4">
                  <pre className="whitespace-pre font-mono text-xs leading-relaxed text-zinc-100">
                    {files[activeTab].content}
                  </pre>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card px-3 py-2.5">
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold tabular-nums truncate">{value}</p>
    </div>
  );
}
