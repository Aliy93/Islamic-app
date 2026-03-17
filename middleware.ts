import { NextRequest, NextResponse } from 'next/server';
import { applySecurityHeaders } from './src/lib/security-headers';

const LANGUAGE_COOKIE_NAME = 'language';
const SUPPORTED_LANGUAGES = ['en', 'ar', 'am', 'om'] as const;
const DEFAULT_LANGUAGE = 'en';
const REDIRECTS = new Map([
  ['/home', '/'],
  ['/pray', '/prayer'],
  ['/qiblah', '/qibla'],
  ['/calendar/today', '/calendar'],
]);

function detectPreferredLanguage(request: NextRequest) {
  const acceptLanguage = request.headers.get('accept-language');
  if (!acceptLanguage) {
    return DEFAULT_LANGUAGE;
  }

  const normalizedLanguages = acceptLanguage
    .split(',')
    .map((entry) => entry.split(';')[0]?.trim().toLowerCase())
    .filter(Boolean);

  const matchedLanguage = normalizedLanguages
    .map((entry) => entry.split('-')[0])
    .find((entry): entry is (typeof SUPPORTED_LANGUAGES)[number] => {
      return SUPPORTED_LANGUAGES.includes(entry as (typeof SUPPORTED_LANGUAGES)[number]);
    });

  return matchedLanguage ?? DEFAULT_LANGUAGE;
}

export function middleware(request: NextRequest) {
  const redirectTarget = REDIRECTS.get(request.nextUrl.pathname);
  if (redirectTarget) {
    const redirectResponse = NextResponse.redirect(new URL(redirectTarget, request.url));
    applySecurityHeaders(redirectResponse.headers, process.env.NODE_ENV !== 'production');
    return redirectResponse;
  }

  const response = NextResponse.next();
  applySecurityHeaders(response.headers, process.env.NODE_ENV !== 'production');
  const existingLanguage = request.cookies.get(LANGUAGE_COOKIE_NAME)?.value;

  if (!existingLanguage || !SUPPORTED_LANGUAGES.includes(existingLanguage as (typeof SUPPORTED_LANGUAGES)[number])) {
    response.cookies.set(LANGUAGE_COOKIE_NAME, detectPreferredLanguage(request), {
      httpOnly: false,
      maxAge: 60 * 60 * 24 * 365,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};