import {
  asyncWrapper,
  ClientError,
  successResponse,
  shouldBeAuthorized,
} from '@/lib/api-utils';

const ALLOWED_TYPES = [
  'text/plain',
  'text/csv',
  'application/octet-stream',
  'application/vnd.ms-excel',
];

const MAX_FILE_SIZE = 1024 * 1024; // 1 MB

function parseLine(line: string): { temperature: number; rateConstant: number } | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('!')) {
    return null; // skip comments and empty lines
  }

  // Split by tab, comma, semicolon, or whitespace
  const parts = trimmed.split(/[,;\t]+|\s+/).filter(Boolean);

  if (parts.length < 2) return null;

  const temperature = parseFloat(parts[0]);
  const rateConstant = parseFloat(parts[1]);

  if (isNaN(temperature) || isNaN(rateConstant)) return null;
  if (temperature <= 0 || rateConstant <= 0) return null;

  return { temperature, rateConstant };
}

export const POST = asyncWrapper(async (request: Request) => {
  await shouldBeAuthorized();

  const contentType = request.headers.get('content-type') ?? '';

  if (!contentType.includes('multipart/form-data')) {
    throw new ClientError('Expected multipart/form-data');
  }

  const formData = await request.formData();
  const file = formData.get('file');

  if (!file || !(file instanceof File)) {
    throw new ClientError('No file uploaded');
  }

  // Validate extension
  const name = file.name.toLowerCase();
  if (!name.endsWith('.txt') && !name.endsWith('.dat') && !name.endsWith('.csv')) {
    throw new ClientError('Unsupported file type. Please upload .txt, .dat, or .csv files.');
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new ClientError('File too large. Maximum size is 1 MB.');
  }

  const text = await file.text();
  const lines = text.split(/\r?\n/);

  const points: { temperature: number; rateConstant: number }[] = [];
  const errors: { line: number; text: string }[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('!')) {
      continue;
    }

    const point = parseLine(line);
    if (point) {
      points.push(point);
    } else {
      errors.push({ line: i + 1, text: trimmed });
    }
  }

  if (points.length < 3) {
    throw new ClientError(
      `Only ${points.length} valid data points found. At least 3 are required.`,
    );
  }

  return successResponse({
    filename: file.name,
    points,
    pointCount: points.length,
    skippedLines: errors,
  });
});
