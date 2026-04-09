import createIntlMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { routing } from '@/lib/i18n';

const intlMiddleware = createIntlMiddleware(routing);

const publicPaths = ['/login', '/register', '/api/auth', '/course'];

function isPublicPath(pathname: string): boolean {
  const withoutLocale = pathname.replace(/^\/(en|pt-BR)/, '') || '/';
  return (
    withoutLocale === '/' ||
    publicPaths.some((p) => withoutLocale.startsWith(p))
  );
}

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/api/') || pathname.startsWith('/_next/')) {
    return NextResponse.next();
  }

  const intlResponse = intlMiddleware(request);

  if (isPublicPath(pathname)) {
    return intlResponse;
  }

  const token =
    request.cookies.get('authjs.session-token')?.value ||
    request.cookies.get('__Secure-authjs.session-token')?.value ||
    request.cookies.get('next-auth.session-token')?.value ||
    request.cookies.get('__Secure-next-auth.session-token')?.value;

  if (!token) {
    const localeMatch = pathname.match(/^\/(en|pt-BR)/);
    const locale = localeMatch ? localeMatch[1] : 'pt-BR';
    const loginUrl = new URL(`/${locale}/login`, request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return intlResponse;
}

export const config = {
  matcher: ['/', '/(en|pt-BR)/:path*'],
};
