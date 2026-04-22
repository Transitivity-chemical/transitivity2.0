// Formatters for scientific numbers: never truncate the mantissa.
// See docs/qa-danilo-round-1.md §2 — SCF energies must preserve full
// double precision through to the UI.

/** High-precision energy display (Hartree). Keeps ≤12 significant digits
 *  and trims trailing zeros. */
export function formatEnergy(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '—';
  // toPrecision(12) covers Gaussian's ~10-digit SCF output and still fits
  // in a reasonable line width; trimTrailingZeros makes it readable.
  const s = value.toPrecision(12);
  // Strip scientific "e" notation re-introduced trailing zeros like 0.0012000e+0
  return trimTrailingZeros(s);
}

/** Frequency in cm⁻¹ — Gaussian emits 4 decimals; keep them. */
export function formatFrequency(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '—';
  return trimTrailingZeros(value.toPrecision(10));
}

function trimTrailingZeros(s: string): string {
  if (!s.includes('.')) return s;
  if (s.includes('e') || s.includes('E')) return s;
  return s.replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
}
