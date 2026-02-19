import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { proxyToFastAPI } from '@/lib/fastapi-proxy';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: reactionId } = await params;

    const reaction = await prisma.reaction.findFirst({
      where: { id: reactionId, userId: session.user.id },
      include: {
        species: { orderBy: { sortOrder: 'asc' } },
        temperatureGrid: true,
        solventConfig: true,
      },
    });

    if (!reaction) {
      return NextResponse.json({ error: 'Reaction not found' }, { status: 404 });
    }

    const reactants = reaction.species.filter((s) => s.role === 'REACTANT');
    const ts = reaction.species.find((s) => s.role === 'TRANSITION_STATE');
    const products = reaction.species.filter((s) => s.role === 'PRODUCT');

    if (reactants.length === 0 || !ts) {
      return NextResponse.json(
        { error: 'Reaction needs at least one reactant and a transition state' },
        { status: 422 },
      );
    }

    const temperatures = reaction.temperatureGrid?.values || [];
    if (temperatures.length === 0) {
      return NextResponse.json({ error: 'Temperature grid is required' }, { status: 422 });
    }

    const body = await request.json().catch(() => ({}));
    const tunnelingMethods = body.tunnelingMethods as string[] | undefined;
    const solventModel = body.solventModel as string | undefined;

    const formatSpecies = (s: typeof reactants[0]) => ({
      scfEnergy: s.scfEnergy,
      electronicPlusEnthalpy: s.electronicPlusEnthalpy,
      electronicPlusFreeEnergy: s.electronicPlusFreeEnergy,
      molecularMassKg: s.molecularMassKg || 0,
      vibrationalTemps: s.vibrationalTemps,
      rotationalTemps: s.rotationalTemps,
      geometryType: (s.rotationalTemps?.length || 0) <= 1 ? 'linear' : 'nonlinear',
      multiplicity: s.multiplicity || 1,
      rotationalSymmetryNumber: s.rotationalSymmetryNumber || 1,
      imaginaryFreq: s.imaginaryFreq,
    });

    const startTime = Date.now();

    const result = await proxyToFastAPI<Record<string, unknown>>('/api/v1/rate-constant/compute', {
      method: 'POST',
      body: JSON.stringify({
        reactants: reactants.map(formatSpecies),
        ts: formatSpecies(ts),
        products: products.map(formatSpecies),
        temperatures,
        reactionType: reaction.reactionType,
        energyType: reaction.energyType,
        tunnelingMethods,
        dParameter: reaction.dParameter,
        solventModel: solventModel || reaction.solventConfig?.solventModel,
        solventViscosity: reaction.solventConfig?.eta0,
      }),
    });

    const computeTimeMs = Date.now() - startTime;

    // Save results to reaction
    await prisma.reaction.update({
      where: { id: reactionId },
      data: {
        status: 'COMPLETED',
        rateConstants: result.rateConstants as object,
        tunnelingCoeffs: result.tunnelingCoeffs as object || undefined,
        partitionRatios: result.partitionFunctions as object || undefined,
        forwardBarrier: result.forwardBarrier as number,
        reverseBarrier: result.reverseBarrier as number || undefined,
        imaginaryFreq: ts.imaginaryFreq,
        crossoverTemp: result.crossoverTemp as number || undefined,
        computeTimeMs,
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Compute error:', error);
    const message = error instanceof Error ? error.message : 'Computation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
