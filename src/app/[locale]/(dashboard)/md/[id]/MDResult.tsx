'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
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
    if (!confirm(t('deleteConfirm'))) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/v1/md/${simulation.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        router.push(`/${locale}/md`);
      }
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header actions */}
      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push(`/${locale}/md`)}
        >
          <ArrowLeft className="mr-1 size-4" />
          {tCommon('back')}
        </Button>

        {files.length > 1 && (
          <Button variant="outline" size="sm" onClick={downloadAll}>
            <Download className="mr-1 size-4" />
            {t('downloadAll')}
          </Button>
        )}

        <Button
          variant="ghost"
          size="sm"
          disabled={deleting}
          onClick={handleDelete}
          className="ml-auto text-destructive hover:text-destructive"
        >
          <Trash2 className="mr-1 size-4" />
          {tCommon('delete')}
        </Button>
      </div>

      {/* Simulation info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t('simulationDetails')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <span className="text-muted-foreground">{t('method')}</span>
              <p className="font-medium">{simulation.mdMethod}</p>
            </div>
            {simulation.dftFunctional && (
              <div>
                <span className="text-muted-foreground">{t('functional')}</span>
                <p className="font-medium">{simulation.dftFunctional}</p>
              </div>
            )}
            {simulation.temperature != null && (
              <div>
                <span className="text-muted-foreground">{t('temperature')}</span>
                <p className="font-medium">{simulation.temperature} K</p>
              </div>
            )}
            {simulation.maxSteps != null && (
              <div>
                <span className="text-muted-foreground">{t('maxSteps')}</span>
                <p className="font-medium">{simulation.maxSteps}</p>
              </div>
            )}
            <div>
              <span className="text-muted-foreground">{t('charge')}</span>
              <p className="font-medium">{simulation.charge}</p>
            </div>
            {simulation.inputMolecules[0] && (
              <div>
                <span className="text-muted-foreground">{t('atoms')}</span>
                <p className="font-medium">
                  {simulation.inputMolecules[0].atoms.length}
                </p>
              </div>
            )}
            <div>
              <span className="text-muted-foreground">Status</span>
              <div>
                <Badge variant="secondary">{simulation.status}</Badge>
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">{t('createdAt')}</span>
              <p className="font-medium">
                {new Date(simulation.createdAt).toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

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

                <div className="max-h-[500px] overflow-auto rounded-md border bg-muted/50 p-4">
                  <pre className="whitespace-pre font-mono text-xs leading-relaxed">
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
