/**
 * Export fitted parameters + predicted curve to a plain-text file.
 * Tkinter v1 format: header with params, then two columns T \t ln_k_fit.
 */

export interface FittingSavePayload {
  theory: string;
  parameters: Record<string, number>;
  chiSquare?: number;
  curve: {
    temperature: number[];
    lnKExp?: number[];
    lnKFit: number[];
  };
  meta?: {
    datasetName?: string;
    theorySubtype?: 'arrhenius' | 'transitivity';
  };
}

export function formatFitAsText(payload: FittingSavePayload): string {
  const lines: string[] = [];
  const datasetName = payload.meta?.datasetName ?? 'fit';
  const timestamp = new Date().toISOString();

  lines.push(`# Transitivity 2.0 — fit export`);
  lines.push(`# Dataset : ${datasetName}`);
  lines.push(`# Theory  : ${payload.theory}`);
  if (payload.meta?.theorySubtype) lines.push(`# Subtype : ${payload.meta.theorySubtype}`);
  if (Number.isFinite(payload.chiSquare)) {
    lines.push(`# ChiSq   : ${payload.chiSquare?.toExponential(4)}`);
  }
  lines.push(`# Exported: ${timestamp}`);
  lines.push(`#`);
  lines.push(`# Fitted parameters:`);
  for (const [k, v] of Object.entries(payload.parameters)) {
    lines.push(`#   ${k.padEnd(6)} = ${Number.isFinite(v) ? v.toExponential(6) : String(v)}`);
  }
  lines.push(`#`);
  lines.push(`# Columns: T(K)  ln(k_exp)  ln(k_fit)`);

  const { temperature, lnKExp, lnKFit } = payload.curve;
  for (let i = 0; i < temperature.length; i++) {
    const T = temperature[i];
    const le = lnKExp?.[i];
    const lf = lnKFit[i];
    const expCol = le === undefined || Number.isNaN(le) ? '-' : le.toExponential(6);
    lines.push(
      `${T.toFixed(3).padStart(10)}  ${expCol.padStart(15)}  ${lf.toExponential(6).padStart(15)}`,
    );
  }

  return lines.join('\n') + '\n';
}

export function downloadFit(payload: FittingSavePayload, filename = 'fit.txt'): void {
  const text = formatFitAsText(payload);
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
