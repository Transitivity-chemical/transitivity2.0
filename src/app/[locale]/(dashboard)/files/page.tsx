import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { FilesGallery, type GalleryFile } from './FilesGallery';

export default async function FilesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect(`/${locale}/login`);

  const rows = await prisma.fileUpload.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: 200,
    select: {
      id: true,
      originalName: true,
      sizeBytes: true,
      fileType: true,
      resourceRole: true,
      resourceType: true,
      resourceId: true,
      sha256: true,
      createdAt: true,
    },
  });

  const initialFiles: GalleryFile[] = rows.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
  }));
  const initialTotalBytes = rows.reduce((s, f) => s + f.sizeBytes, 0);

  return (
    <div className="mx-auto w-full max-w-5xl p-8">
      <FilesGallery locale={locale} initialFiles={initialFiles} initialTotalBytes={initialTotalBytes} />
    </div>
  );
}
