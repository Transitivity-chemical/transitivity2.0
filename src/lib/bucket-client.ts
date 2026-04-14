/**
 * Server-side client for the pitomba-hosted bucket.
 *
 * Uses the existing FastAPI proxy (FASTAPI_URL env var) to talk to
 * `POST /api/v1/files/store` and `GET /api/v1/files/download`.
 *
 * Next.js API routes are responsible for:
 *  1. NextAuth session check (userId extraction).
 *  2. Calling storeFileInBucket() with the user's bytes.
 *  3. Persisting a Prisma FileUpload row with the returned metadata.
 *  4. Returning the public file id + signed Next.js download URL.
 */

import { prisma } from '@/lib/prisma';
import type { UploadRole, UploadFileType } from '@prisma/client';

const FASTAPI_URL = process.env.FASTAPI_URL || 'http://pitomba.ueg.br';

interface StoreResult {
  storagePath: string;
  absolutePath: string;
  sha256: string;
  sizeBytes: number;
  filename: string;
}

export async function uploadToBucket(params: {
  userId: string;
  resourceType: 'inputs' | 'outputs';
  resourceId?: string | null;
  filename: string;
  data: Buffer | Uint8Array;
  mimeType?: string;
}): Promise<StoreResult> {
  const form = new FormData();
  form.append('user_id', params.userId);
  form.append('resource_type', params.resourceType);
  if (params.resourceId) form.append('resource_id', params.resourceId);
  const blob = new Blob([params.data as BlobPart], {
    type: params.mimeType ?? 'application/octet-stream',
  });
  form.append('file', blob, params.filename);

  const res = await fetch(`${FASTAPI_URL}/api/v1/files/store`, {
    method: 'POST',
    body: form,
    cache: 'no-store',
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`bucket store failed: ${res.status} ${body}`);
  }
  return (await res.json()) as StoreResult;
}

export async function downloadFromBucket(params: {
  userId: string;
  storagePath: string;
  admin?: boolean;
}): Promise<Uint8Array> {
  const qs = new URLSearchParams({
    user_id: params.userId,
    path: params.storagePath,
    admin: params.admin ? 'true' : 'false',
  });
  const res = await fetch(`${FASTAPI_URL}/api/v1/files/download?${qs}`, {
    cache: 'no-store',
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`bucket download failed: ${res.status} ${body}`);
  }
  const buf = await res.arrayBuffer();
  return new Uint8Array(buf);
}

/**
 * Upload bytes + insert a FileUpload row in one call. Returns the Prisma
 * row so callers can link it to their resource.
 */
export async function storeAndPersist(params: {
  userId: string;
  filename: string;
  originalName: string;
  data: Buffer | Uint8Array;
  mimeType: string;
  fileType: UploadFileType;
  role?: UploadRole;
  resourceType?: string | null;
  resourceId?: string | null;
}) {
  const stored = await uploadToBucket({
    userId: params.userId,
    resourceType: (params.role ?? 'INPUT') === 'INPUT' ? 'inputs' : 'outputs',
    resourceId: params.resourceId ?? null,
    filename: params.originalName,
    data: params.data,
    mimeType: params.mimeType,
  });

  return prisma.fileUpload.create({
    data: {
      userId: params.userId,
      filename: params.filename,
      originalName: params.originalName,
      mimeType: params.mimeType,
      sizeBytes: stored.sizeBytes,
      storagePath: stored.storagePath,
      sha256: stored.sha256,
      fileType: params.fileType,
      resourceRole: params.role ?? 'INPUT',
      resourceType: params.resourceType ?? null,
      resourceId: params.resourceId ?? null,
    },
  });
}
