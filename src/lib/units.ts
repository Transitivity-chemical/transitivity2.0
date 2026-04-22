// Unit conversions for Rate Constant results.
// See docs/qa-danilo-round-1.md §§5–7.

export type EnergyUnit = 'kcalmol' | 'kjmol';
export type KUnit = 'Lmols' | 'cm3mols' | 'cm3molecules';

export const ENERGY_UNIT_LABEL: Record<EnergyUnit, string> = {
  kcalmol: 'kcal·mol⁻¹',
  kjmol: 'kJ·mol⁻¹',
};

export const K_UNIT_LABEL: Record<KUnit, string> = {
  Lmols: 'L·mol⁻¹·s⁻¹',
  cm3mols: 'cm³·mol⁻¹·s⁻¹',
  cm3molecules: 'cm³·molecule⁻¹·s⁻¹',
};

const AVOGADRO = 6.02214076e23;
const KJ_PER_KCAL = 4.184;

/** Canonical backend unit for energies is kJ·mol⁻¹. */
export function convertEnergyFromKJmol(valueKJmol: number, to: EnergyUnit): number {
  if (to === 'kjmol') return valueKJmol;
  return valueKJmol / KJ_PER_KCAL;
}

/** Canonical backend unit for bimolecular k is L·mol⁻¹·s⁻¹. Unimolecular
 *  k ships as s⁻¹ and ignores the selector. */
export function convertKFromLmols(valueLmols: number, to: KUnit): number {
  switch (to) {
    case 'Lmols':
      return valueLmols;
    case 'cm3mols':
      // 1 L = 1000 cm³
      return valueLmols * 1000;
    case 'cm3molecules':
      // cm³·mol⁻¹·s⁻¹ → divide by Nₐ
      return (valueLmols * 1000) / AVOGADRO;
  }
}

export function kUnitForReaction(reactionType: string, selected: KUnit): string {
  if (reactionType === 'UNIMOLECULAR') return 's⁻¹';
  return K_UNIT_LABEL[selected];
}
