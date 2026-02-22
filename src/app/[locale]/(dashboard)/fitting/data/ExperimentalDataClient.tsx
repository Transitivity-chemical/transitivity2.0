'use client';

import { useCallback, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  DataEntryTable,
  createEmptyRow,
  type DataPoint,
} from '@/components/chemistry/DataEntryTable';

interface ValidationError {
  rowId: string;
  field: 'temperature' | 'rateConstant';
  message: string;
}

export function ExperimentalDataClient() {
  const t = useTranslations('fitting');
  const tCommon = useTranslations('common');

  const [name, setName] = useState('');
  const [source, setSource] = useState('');
  const [citation, setCitation] = useState('');
  const [doi, setDoi] = useState('');
  const [points, setPoints] = useState<DataPoint[]>([
    createEmptyRow(),
    createEmptyRow(),
    createEmptyRow(),
  ]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>(
    [],
  );
  const [submitStatus, setSubmitStatus] = useState<
    'idle' | 'loading' | 'success' | 'error'
  >('idle');
  const [submitMessage, setSubmitMessage] = useState('');

  const validate = useCallback((): boolean => {
    const errors: ValidationError[] = [];

    for (const point of points) {
      const temp = parseFloat(point.temperature);
      const rate = parseFloat(point.rateConstant);

      if (point.temperature.trim() === '' && point.rateConstant.trim() === '') {
        continue; // skip completely empty rows
      }

      if (isNaN(temp) || temp <= 0) {
        errors.push({
          rowId: point.id,
          field: 'temperature',
          message: 'T > 0',
        });
      }

      if (isNaN(rate) || rate <= 0) {
        errors.push({
          rowId: point.id,
          field: 'rateConstant',
          message: 'k > 0',
        });
      }
    }

    // Count valid points
    const validPoints = points.filter((p) => {
      const temp = parseFloat(p.temperature);
      const rate = parseFloat(p.rateConstant);
      return !isNaN(temp) && temp > 0 && !isNaN(rate) && rate > 0;
    });

    if (validPoints.length < 3) {
      // Don't add row-level errors, just set a general message
      setSubmitMessage(t('minPoints'));
      setSubmitStatus('error');
    }

    setValidationErrors(errors);
    return errors.length === 0 && validPoints.length >= 3;
  }, [points, t]);

  const handleSave = useCallback(async () => {
    if (!name.trim()) {
      setSubmitMessage('Name is required');
      setSubmitStatus('error');
      return;
    }

    if (!validate()) return;

    const validPoints = points
      .filter((p) => {
        const temp = parseFloat(p.temperature);
        const rate = parseFloat(p.rateConstant);
        return !isNaN(temp) && temp > 0 && !isNaN(rate) && rate > 0;
      })
      .map((p) => ({
        temperature: parseFloat(p.temperature),
        rateConstant: parseFloat(p.rateConstant),
      }));

    setSubmitStatus('loading');
    setSubmitMessage('');

    try {
      const res = await fetch('/api/v1/experimental-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          source: source.trim() || undefined,
          citation: citation.trim() || undefined,
          doi: doi.trim() || undefined,
          points: validPoints,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setSubmitStatus('error');
        setSubmitMessage(json.error || 'Failed to save');
        return;
      }

      setSubmitStatus('success');
      setSubmitMessage(
        json.validated
          ? `${tCommon('success')}: ${validPoints.length} ${t('dataPoints').toLowerCase()} validated`
          : `${tCommon('success')}: dataset saved`,
      );
    } catch {
      setSubmitStatus('error');
      setSubmitMessage(tCommon('error'));
    }
  }, [name, source, citation, doi, points, validate, t, tCommon]);

  return (
    <div className="space-y-6">
      {/* Metadata Card */}
      <Card>
        <CardHeader>
          <CardTitle>{t('dataInput')}</CardTitle>
          <CardDescription>{t('source')}, {t('citation')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">
                {tCommon('save')} name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. OH + H2 experimental"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                {t('source')}
              </label>
              <input
                type="text"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="e.g. NIST Kinetics Database"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                {t('citation')}
              </label>
              <input
                type="text"
                value={citation}
                onChange={(e) => setCitation(e.target.value)}
                placeholder="e.g. Smith et al., J. Chem. Phys., 1994"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">DOI</label>
              <input
                type="text"
                value={doi}
                onChange={(e) => setDoi(e.target.value)}
                placeholder="e.g. 10.1021/..."
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Entry Card */}
      <Card>
        <CardHeader>
          <CardTitle>{t('manualEntry')}</CardTitle>
          <CardDescription>
            {t('dataInputDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataEntryTable
            points={points}
            onChange={setPoints}
            errors={validationErrors}
          />
        </CardContent>
      </Card>

      {/* Save */}
      <div className="flex items-center gap-4">
        <Button onClick={handleSave} disabled={submitStatus === 'loading'}>
          {submitStatus === 'loading' ? tCommon('loading') : t('saveData')}
        </Button>

        {submitMessage && (
          <p
            className={`text-sm ${
              submitStatus === 'error'
                ? 'text-destructive'
                : 'text-green-600 dark:text-green-400'
            }`}
          >
            {submitMessage}
          </p>
        )}
      </div>
    </div>
  );
}
