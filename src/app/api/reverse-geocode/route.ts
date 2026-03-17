import { NextRequest, NextResponse } from 'next/server';

import { parseReverseGeocodeLabel } from '@/lib/external-data';
import { applySecurityHeaders, stripFingerprintingHeaders } from '@/lib/security-headers';

const NOMINATIM_REVERSE_URL = 'https://nominatim.openstreetmap.org/reverse';
const CACHE_CONTROL_HEADER = 'no-store';
const APP_USER_AGENT = 'Islamic-app/1.0';
const NOMINATIM_TIMEOUT_MS = 8000;
const isDev = process.env.NODE_ENV !== 'production';

function buildNominatimHeaders(request: NextRequest) {
  const requestOrigin = request.nextUrl.origin;
  const acceptLanguage = request.headers.get('accept-language') ?? 'en';
  const nominatimContactEmail = process.env.NOMINATIM_CONTACT_EMAIL?.trim();

  return {
    Accept: 'application/json',
    'Accept-Language': acceptLanguage,
    Referer: requestOrigin,
    'User-Agent': nominatimContactEmail
      ? `${APP_USER_AGENT} (${requestOrigin}; ${nominatimContactEmail})`
      : `${APP_USER_AGENT} (${requestOrigin})`,
  };
}

function buildErrorResponse(status: number, message: string) {
  const response = NextResponse.json(
    { error: message },
    {
      status,
      headers: {
        'Cache-Control': CACHE_CONTROL_HEADER,
      },
    }
  );

  stripFingerprintingHeaders(response.headers);
  applySecurityHeaders(response.headers, isDev);

  return response;
}

function logUpstreamFailure(details: Record<string, unknown>) {
  console.error('[reverse-geocode] upstream failure', details);
}

function parseCoordinate(value: string | null, min: number, max: number) {
  if (!value) return null;

  const parsedValue = Number(value);
  if (!Number.isFinite(parsedValue) || parsedValue < min || parsedValue > max) {
    return null;
  }

  return parsedValue;
}

export async function GET(request: NextRequest) {
  const latitude = parseCoordinate(request.nextUrl.searchParams.get('lat'), -90, 90);
  const longitude = parseCoordinate(request.nextUrl.searchParams.get('lon'), -180, 180);

  if (latitude === null || longitude === null) {
    return buildErrorResponse(400, 'Invalid coordinates.');
  }

  const nominatimUrl = new URL(NOMINATIM_REVERSE_URL);
  nominatimUrl.searchParams.set('format', 'jsonv2');
  nominatimUrl.searchParams.set('addressdetails', '1');
  nominatimUrl.searchParams.set('lat', latitude.toString());
  nominatimUrl.searchParams.set('lon', longitude.toString());

  const nominatimContactEmail = process.env.NOMINATIM_CONTACT_EMAIL?.trim();
  if (nominatimContactEmail) {
    nominatimUrl.searchParams.set('email', nominatimContactEmail);
  }

  try {
    const upstreamResponse = await fetch(nominatimUrl, {
      cache: 'no-store',
      headers: buildNominatimHeaders(request),
      signal: AbortSignal.timeout(NOMINATIM_TIMEOUT_MS),
    });

    if (!upstreamResponse.ok) {
      logUpstreamFailure({
        status: upstreamResponse.status,
        statusText: upstreamResponse.statusText,
        timeoutMs: NOMINATIM_TIMEOUT_MS,
        hasContactEmail: Boolean(nominatimContactEmail),
      });

      return buildErrorResponse(502, 'Reverse geocoding lookup failed.');
    }

    const payload = await upstreamResponse.json();
    const label = parseReverseGeocodeLabel(payload);

    const jsonResponse = NextResponse.json(
      { label },
      {
        headers: {
          'Cache-Control': CACHE_CONTROL_HEADER,
        },
      }
    );

    stripFingerprintingHeaders(jsonResponse.headers);
    applySecurityHeaders(jsonResponse.headers, isDev);

    return jsonResponse;
  } catch (error: unknown) {
    const isTimeoutError = error instanceof Error && error.name === 'TimeoutError';
    const isAbortError = error instanceof Error && error.name === 'AbortError';

    logUpstreamFailure({
      errorName: error instanceof Error ? error.name : 'UnknownError',
      message: error instanceof Error ? error.message : 'Unknown reverse geocode failure',
      failureType: isTimeoutError || isAbortError ? 'timeout' : 'network',
      timeoutMs: NOMINATIM_TIMEOUT_MS,
      hasContactEmail: Boolean(nominatimContactEmail),
    });

    return buildErrorResponse(502, 'Reverse geocoding lookup failed.');
  }
}