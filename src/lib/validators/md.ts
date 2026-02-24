import { z } from 'zod';

export const mdAtomSchema = z.object({
  element: z.string().min(1, 'Element is required').max(3),
  x: z.number(),
  y: z.number(),
  z: z.number(),
});

export const mdGenerateSchema = z
  .object({
    name: z.string().min(1).max(200).optional(),
    atoms: z.array(mdAtomSchema).min(1, 'At least one atom is required'),
    dynamicsType: z.enum(['CPMD', 'BOMD', 'PIMD', 'SHMD', 'MTD']).default('CPMD'),
    functional: z
      .enum(['BLYP', 'PBE', 'BP86', 'PW91', 'B3LYP', 'PBE0'])
      .default('BLYP'),
    charge: z.number().int().default(0),
    lsd: z.number().int().min(0).max(1).default(0),
    temperature: z.number().positive().default(300),
    maxSteps: z.number().int().positive().default(10000),
    timeStep: z.number().positive().default(5.0),
    latticeA: z.number().positive().default(20.0),
    latticeB: z.number().positive().default(20.0),
    latticeC: z.number().positive().default(20.0),
    cosA: z.number().default(0.0),
    cosB: z.number().default(0.0),
    cosC: z.number().default(0.0),
    cutoff: z.number().positive().default(70.0),
    emass: z.number().positive().default(400.0),
    multiplicity: z.number().int().positive().default(1),
    generateWavefunction: z.boolean().default(true),
    generateGaussview: z.boolean().default(true),
  })
  .strict();

export type MDGenerateInput = z.infer<typeof mdGenerateSchema>;
export type MDAtomInput = z.infer<typeof mdAtomSchema>;
