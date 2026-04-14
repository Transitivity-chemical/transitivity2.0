import { auth } from '@/lib/auth';
import { proxyToFastAPI } from '@/lib/fastapi-proxy';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import type { ReactionType, PESEnergyType, CalcStatus } from '@prisma/client';

type SpeciesPayload = {
  scfEnergy?: number | null;
  electronicPlusEnthalpy?: number | null;
  electronicPlusFreeEnergy?: number | null;
  molecularMassKg?: number;
  vibrationalTemps?: number[];
  rotationalTemps?: number[];
  geometryType?: 'linear' | 'nonlinear';
  multiplicity?: number;
  rotationalSymmetryNumber?: number;
  imaginaryFreq?: number | null;
};

type RunRateConstantRequest = {
  reactants: SpeciesPayload[];
  ts?: SpeciesPayload;
  products?: SpeciesPayload[];
  temperatures: number[];
  reactionType?: 'UNIMOLECULAR' | 'BIMOLECULAR';
  energyType?: 'En' | 'Ent' | 'EnG';
  tunnelingMethods?: string[];
  dParameter?: number;
  solventModel?: string;
  solventName?: string;
  solventViscosity?: number;
  radiusA?: number;
  radiusB?: number;
};

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json()) as RunRateConstantRequest;

    if (!Array.isArray(body.reactants) || body.reactants.length === 0) {
      return NextResponse.json(
        { error: 'At least one reactant is required.' },
        { status: 422 },
      );
    }

    if (!body.ts) {
      return NextResponse.json(
        { error: 'A transition state is required.' },
        { status: 422 },
      );
    }

    if (!Array.isArray(body.temperatures) || body.temperatures.length === 0) {
      return NextResponse.json(
        { error: 'At least one temperature is required.' },
        { status: 422 },
      );
    }

    const result = await proxyToFastAPI<Record<string, unknown>>('/api/v1/rate-constant/compute', {
      method: 'POST',
      body: JSON.stringify({
        reactants: body.reactants,
        ts: body.ts,
        products: body.products || [],
        temperatures: body.temperatures,
        reactionType: body.reactionType || 'BIMOLECULAR',
        energyType: body.energyType || 'En',
        tunnelingMethods: body.tunnelingMethods || [],
        dParameter: body.dParameter,
        solventModel: body.solventModel || undefined,
        solventName: body.solventName || undefined,
        solventViscosity: body.solventViscosity,
        radiusA: body.radiusA,
        radiusB: body.radiusB,
      }),
    });

    // Persist a Reaction row so the run appears in history.
    try {
      await prisma.reaction.create({
        data: {
          userId: session.user.id,
          name: (body as { reactionName?: string }).reactionName?.trim() || 'Rate constant run',
          reactionType: (body.reactionType || 'BIMOLECULAR') as ReactionType,
          energyType: (body.energyType || 'En') as PESEnergyType,
          status: 'COMPLETED' as CalcStatus,
        },
      });
    } catch (e) {
      console.warn('Failed to persist Reaction history row:', e);
    }

    return NextResponse.json({ result });
  } catch (error) {
    console.error('Direct rate constant run error:', error);
    const message = error instanceof Error ? error.message : 'Computation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
