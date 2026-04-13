/**
 * Client-side Marcus electron-transfer rate constant.
 * Mirrors backend/src/services/marcus.py so the UI works without a live
 * backend (e.g., local dev or before the Marcus endpoint ships to prod).
 *
 * ΔG° = E(products) − E(reactants)                  (eV)
 * λ   = E(vertical products) − E(relaxed products)  (eV)
 * ΔG‡ = (λ + ΔG°)² / (4λ)                           (eV)
 * k(T) = A · exp(−ΔG‡ / kT)                         (s⁻¹)
 *
 * Input energies must be Hartree (a.u.) from Gaussian SCF output.
 */

export const HARTREE_TO_EV = 27.211386245988;
export const KB_EV = 8.617333262e-5;
export const DEFAULT_PREFACTOR = 1.0e13;

export interface MarcusInputSpecies {
  filename?: string | null;
  scfEnergy?: number | null;
}

export interface MarcusComputeInput {
  reactants: MarcusInputSpecies[];
  products: MarcusInputSpecies[];
  verticalProducts: MarcusInputSpecies[];
  temperatures: number[];
  prefactor?: number;
}

export interface MarcusComputeResult {
  temperatures: number[];
  rate_constants: number[];
  lambda_reorganization: number;
  dg_activation: number;
  dg_reaction: number;
}

function sumEnergies(species: MarcusInputSpecies[]): { total: number; allNull: boolean } {
  let total = 0;
  let allNull = true;
  for (const s of species) {
    if (s?.scfEnergy != null) {
      total += s.scfEnergy;
      allNull = false;
    }
  }
  return { total, allNull };
}

export function computeMarcus(input: MarcusComputeInput): MarcusComputeResult {
  const reactants = sumEnergies(input.reactants);
  const products = sumEnergies(input.products);
  const vertical = sumEnergies(input.verticalProducts);

  if (reactants.allNull) throw new Error('Missing reactant SCF energy');
  if (products.allNull) throw new Error('Missing product SCF energy');
  if (vertical.allNull) throw new Error('Missing vertical product SCF energy');

  const dgReactionEv = (products.total - reactants.total) * HARTREE_TO_EV;
  const lambdaEv = (vertical.total - products.total) * HARTREE_TO_EV;

  if (lambdaEv <= 0) {
    throw new Error(
      `Reorganization energy must be positive (got λ = ${lambdaEv.toFixed(4)} eV). ` +
        'Check that vertical products are at the reactant Franck-Condon geometry.',
    );
  }

  const dgActivationEv = Math.pow(lambdaEv + dgReactionEv, 2) / (4 * lambdaEv);
  const prefactor = input.prefactor ?? DEFAULT_PREFACTOR;

  const temps = input.temperatures.length > 0 ? input.temperatures : [298.15];
  const rateConstants = temps.map((T) => {
    if (T <= 0) return 0;
    return prefactor * Math.exp(-dgActivationEv / (KB_EV * T));
  });

  return {
    temperatures: temps,
    rate_constants: rateConstants,
    lambda_reorganization: lambdaEv,
    dg_activation: dgActivationEv,
    dg_reaction: dgReactionEv,
  };
}
