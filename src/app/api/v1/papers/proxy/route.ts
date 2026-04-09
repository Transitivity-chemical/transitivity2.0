import { NextRequest } from 'next/server';
import { shouldBeAuthorized, ClientError, errorResponse } from '@/lib/api-utils';

/**
 * FIX-1: Server-side paper proxy.
 *
 * Many publishers block iframe embedding via X-Frame-Options or CORS.
 * This proxy fetches the URL server-side and streams it back, allowing
 * the wiki paper reader to embed papers regardless of publisher headers.
 *
 * Limitations:
 * - Only allows whitelisted domains (DOIs, arxiv, mdpi, acs, rsc, springer, etc.)
 *   so the proxy isn't a general-purpose SSRF gadget
 * - Strips X-Frame-Options/CSP from response
 * - Caches with 'no-store' so we don't accidentally serve copyrighted material
 *   from edge caches
 */

const ALLOWED_HOSTS = [
  'doi.org', 'dx.doi.org',
  'arxiv.org', 'www.arxiv.org',
  'www.mdpi.com', 'mdpi.com',
  'pubs.acs.org', 'acs.org',
  'pubs.rsc.org', 'rsc.org',
  'link.springer.com', 'springer.com',
  'onlinelibrary.wiley.com', 'wiley.com',
  'www.sciencedirect.com', 'sciencedirect.com',
  'iopscience.iop.org', 'iop.org',
  'www.nature.com', 'nature.com',
  'pubmed.ncbi.nlm.nih.gov', 'ncbi.nlm.nih.gov',
  'journals.aps.org',
  'www.cpmd.org', 'cpmd.org',
  'github.com', 'raw.githubusercontent.com',
];

function isAllowed(host: string): boolean {
  const h = host.toLowerCase();
  return ALLOWED_HOSTS.some((allowed) => h === allowed || h.endsWith(`.${allowed}`));
}

export async function GET(request: NextRequest) {
  try {
    await shouldBeAuthorized();
    const url = request.nextUrl.searchParams.get('url');
    if (!url) throw new ClientError('Missing url parameter', 400);

    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      throw new ClientError('Invalid URL', 400);
    }

    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new ClientError('Only http(s) URLs allowed', 400);
    }

    if (!isAllowed(parsed.host)) {
      throw new ClientError(`Host not in allowlist: ${parsed.host}`, 403);
    }

    const upstream = await fetch(parsed.toString(), {
      headers: {
        // Some publishers serve different content based on UA
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36',
        Accept: 'application/pdf,text/html,application/xhtml+xml,*/*',
      },
      redirect: 'follow',
    });

    if (!upstream.ok) {
      return errorResponse(`Upstream returned ${upstream.status}`, upstream.status);
    }

    const contentType = upstream.headers.get('content-type') || 'application/octet-stream';
    const body = await upstream.arrayBuffer();

    return new Response(body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'private, no-store',
        'X-Frame-Options': 'SAMEORIGIN',
      },
    });
  } catch (err) {
    if (err instanceof ClientError) return errorResponse(err.message, err.statusCode);
    console.error('[papers/proxy]', err);
    return errorResponse('Proxy failed', 502);
  }
}
