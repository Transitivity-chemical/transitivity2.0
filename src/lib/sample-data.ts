/**
 * Sample data for "Load Example" buttons in each feature wizard.
 * Data extracted from the Transitivity legacy doc/examples directory.
 */

// ─── Fitting ─────────────────────────────────────────────────────────

export const SAMPLE_FITTING_META = {
  title: 'OH + HBr (Anti-Arrhenius)',
  authors: 'Sims, I.R.; Smith, I.W.M.; Clary, D.C.; Bocherel, P.; Rowe, B.R.',
  citation:
    'Ultra-low temperature kinetics of neutral-neutral reactions: new experimental and theoretical results for OH+HBr between 295 and 23 K, 1994',
};

/** Anti-Arrhenius dataset: OH + HBr, 23-295 K */
export const SAMPLE_FITTING_DATA: { temperature: number; rateConstant: number }[] = [
  { temperature: 23, rateConstant: 1.04e-10 },
  { temperature: 25, rateConstant: 9.99e-11 },
  { temperature: 50, rateConstant: 6.48e-11 },
  { temperature: 75, rateConstant: 4.71e-11 },
  { temperature: 100, rateConstant: 3.69e-11 },
  { temperature: 125, rateConstant: 3.03e-11 },
  { temperature: 150, rateConstant: 2.57e-11 },
  { temperature: 175, rateConstant: 2.23e-11 },
  { temperature: 200, rateConstant: 1.97e-11 },
  { temperature: 225, rateConstant: 1.76e-11 },
  { temperature: 250, rateConstant: 1.6e-11 },
  { temperature: 275, rateConstant: 1.46e-11 },
  { temperature: 295, rateConstant: 1.36e-11 },
];

// ─── Molecular Geometry (Benzoic acid from GJF) ─────────────────────

/** Benzoic acid geometry — Cartesian coordinates in Angstroms */
export const SAMPLE_BENZOIC_ACID_ATOMS = [
  { element: 'H', x: '-4.84210000', y: '0.79300000', z: '0.22740000' },
  { element: 'H', x: '-1.20450000', y: '3.08460000', z: '-0.24430000' },
  { element: 'H', x: '-2.52800000', y: '5.17620000', z: '-0.21430000' },
  { element: 'H', x: '-5.00010000', y: '5.09390000', z: '0.03220000' },
  { element: 'H', x: '-6.15370000', y: '2.90260000', z: '0.25430000' },
  { element: 'H', x: '-0.48580000', y: '-0.27210000', z: '-0.24580000' },
  { element: 'C', x: '-4.33110000', y: '1.75890000', z: '0.12780000' },
  { element: 'C', x: '-2.94120000', y: '1.80290000', z: '-0.01420000' },
  { element: 'C', x: '-2.29420000', y: '3.03580000', z: '-0.13550000' },
  { element: 'C', x: '-3.03620000', y: '4.21110000', z: '-0.11810000' },
  { element: 'C', x: '-4.41980000', y: '4.16530000', z: '0.02030000' },
  { element: 'C', x: '-5.06500000', y: '2.93970000', z: '0.14390000' },
  { element: 'C', x: '-2.18830000', y: '0.52820000', z: '-0.02990000' },
  { element: 'O', x: '-2.60920000', y: '-0.60500000', z: '0.13770000' },
  { element: 'O', x: '-0.85470000', y: '0.60580000', z: '-0.26130000' },
];

// ─── MD ──────────────────────────────────────────────────────────────

export const SAMPLE_MD_GEOMETRY = SAMPLE_BENZOIC_ACID_ATOMS;

// ─── ML ──────────────────────────────────────────────────────────────

export const SAMPLE_ML_GEOMETRY = SAMPLE_BENZOIC_ACID_ATOMS;

// ─── Rate Constant ───────────────────────────────────────────────────

/**
 * Pre-filled example for a bimolecular gas-phase reaction: OH + HCl -> H2O + Cl
 * Values are realistic computational chemistry results at CCSD(T)/aug-cc-pVTZ level.
 */
export const SAMPLE_RATE_CONSTANT_DATA = {
  name: 'OH + HCl -> H2O + Cl',
  reactionType: 'BIMOLECULAR' as const,
  energyType: 'En' as const,
  species: [
    {
      role: 'REACTANT' as const,
      label: 'OH',
      scfEnergy: -75.634067,
      nAtoms: 2,
      charge: 0,
      multiplicity: 2,
    },
    {
      role: 'REACTANT' as const,
      label: 'HCl',
      scfEnergy: -460.109965,
      nAtoms: 2,
      charge: 0,
      multiplicity: 1,
    },
    {
      role: 'TRANSITION_STATE' as const,
      label: 'TS',
      scfEnergy: -535.730208,
      nAtoms: 4,
      charge: 0,
      multiplicity: 2,
    },
    {
      role: 'PRODUCT' as const,
      label: 'H2O',
      scfEnergy: -76.332059,
      nAtoms: 3,
      charge: 0,
      multiplicity: 1,
    },
    {
      role: 'PRODUCT' as const,
      label: 'Cl',
      scfEnergy: -459.553789,
      nAtoms: 1,
      charge: 0,
      multiplicity: 2,
    },
  ],
};
