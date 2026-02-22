import { z } from 'zod';

export const experimentalPointSchema = z.object({
  temperature: z.number().positive('Temperature must be positive'),
  rateConstant: z.number().positive('Rate constant must be positive'),
});

export const experimentalDataSchema = z
  .object({
    name: z.string().min(1, 'Name is required').max(200),
    source: z.string().optional(),
    citation: z.string().optional(),
    doi: z.string().optional(),
    reactionId: z.string().optional(),
    points: z
      .array(experimentalPointSchema)
      .min(3, 'At least 3 data points are required'),
  })
  .strict();

export type ExperimentalDataInput = z.infer<typeof experimentalDataSchema>;
export type ExperimentalPoint = z.infer<typeof experimentalPointSchema>;
