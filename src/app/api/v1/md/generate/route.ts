import { prisma } from '@/lib/prisma';
import { proxyToFastAPI } from '@/lib/fastapi-proxy';
import { mdGenerateSchema } from '@/lib/validators/md';
import {
  asyncWrapper,
  successResponse,
  parseRequestJson,
  shouldBeAuthorized,
} from '@/lib/api-utils';
import type { MDFileType, MDMethod } from '@prisma/client';

interface GeneratedFileEntry {
  filename: string;
  content: string;
  type: string;
}

interface FastAPIGenerateResponse {
  files: Record<string, GeneratedFileEntry>;
}

export const POST = asyncWrapper(async (request: Request) => {
  const session = await shouldBeAuthorized();
  const data = await parseRequestJson(request, mdGenerateSchema);

  // Proxy to FastAPI
  const result = await proxyToFastAPI<FastAPIGenerateResponse>(
    '/api/v1/md/generate',
    {
      method: 'POST',
      body: JSON.stringify(data),
    },
  );

  // Save simulation + molecule + atoms + generated files in a transaction
  const simulation = await prisma.$transaction(async (tx) => {
    const sim = await tx.mDSimulation.create({
      data: {
        userId: session.user!.id!,
        name: data.name || `${data.dynamicsType} Simulation`,
        mdMethod: data.dynamicsType as MDMethod,
        status: 'COMPLETED',
        dftFunctional: data.functional,
        charge: data.charge,
        lsdFlag: data.lsd,
        temperature: data.temperature,
        maxSteps: data.maxSteps,
        timeStep: data.timeStep,
        latticeA: data.latticeA,
        latticeB: data.latticeB,
        latticeC: data.latticeC,
        cosA: data.cosA,
        cosB: data.cosB,
        cosC: data.cosC,
      },
    });

    // Create molecule record
    const molecule = await tx.mDMolecule.create({
      data: {
        simulationId: sim.id,
        label: 'Input molecule',
        nAtoms: data.atoms.length,
        sortOrder: 0,
      },
    });

    // Create atom records
    await tx.mDAtom.createMany({
      data: data.atoms.map((atom, idx) => ({
        moleculeId: molecule.id,
        atomIndex: idx,
        element: atom.element,
        x: atom.x,
        y: atom.y,
        z: atom.z,
      })),
    });

    // Create generated file records
    const fileEntries = Object.values(result.files);
    if (fileEntries.length > 0) {
      await tx.mDGeneratedFile.createMany({
        data: fileEntries.map((f) => ({
          simulationId: sim.id,
          fileType: f.type as MDFileType,
          filename: f.filename,
          content: f.content,
        })),
      });
    }

    return sim;
  });

  // Return the simulation with generated files
  const full = await prisma.mDSimulation.findUnique({
    where: { id: simulation.id },
    include: {
      inputMolecules: { include: { atoms: true } },
      generatedFiles: true,
    },
  });

  return successResponse(full, 201);
});
