import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
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
    });

    if (!reaction) {
      return NextResponse.json({ error: 'Reaction not found' }, { status: 404 });
    }

    const body = await request.json();
    const {
      role,
      label,
      fileUploadId,
      parsedData,
    } = body as {
      role: 'REACTANT' | 'TRANSITION_STATE' | 'PRODUCT' | 'VERTICAL_PRODUCT';
      label?: string;
      fileUploadId?: string;
      parsedData?: Record<string, unknown>;
    };

    if (!role) {
      return NextResponse.json({ error: 'role is required' }, { status: 400 });
    }

    // Count existing species for sort order
    const count = await prisma.species.count({ where: { reactionId, role } });

    const speciesData: Record<string, unknown> = {
      reactionId,
      role,
      label: label || `${role} ${count + 1}`,
      sortOrder: count,
      fileUploadId: fileUploadId || undefined,
    };

    // If parsedData provided (from cclib), populate species fields
    if (parsedData) {
      Object.assign(speciesData, {
        nAtoms: parsedData.nAtoms,
        charge: parsedData.charge,
        multiplicity: parsedData.multiplicity,
        molecularMass: parsedData.molecularMass,
        molecularMassKg: parsedData.molecularMassKg,
        scfEnergy: parsedData.scfEnergy,
        zpe: parsedData.zpe,
        electronicPlusZPE: parsedData.electronicPlusZPE,
        electronicPlusEnthalpy: parsedData.electronicPlusEnthalpy,
        electronicPlusFreeEnergy: parsedData.electronicPlusFreeEnergy,
        imaginaryFreq: parsedData.imaginaryFreq,
        vibrationalTemps: parsedData.vibrationalTemps || [],
        rotationalTemps: parsedData.rotationalTemps || [],
        rotationalSymmetryNumber: parsedData.rotationalSymmetryNumber,
        cartesianCoords: parsedData.cartesianCoords,
        atomComposition: parsedData.atomComposition,
        qcEngine: parsedData.qcEngine,
      });
    }

    const species = await prisma.species.create({ data: speciesData as never });

    return NextResponse.json(species, { status: 201 });
  } catch (error) {
    console.error('Create species error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
