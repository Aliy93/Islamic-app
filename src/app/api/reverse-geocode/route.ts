import { NextRequest, NextResponse } from 'next/server';

import { parseReverseGeocodeLabel } from '@/lib/external-data';
import { applySecurityHeaders, stripFingerprintingHeaders } from '@/lib/security-headers';

const NOMINATIM_REVERSE_URL = 'https://nominatim.openstreetmap.org/reverse';
const CACHE_CONTROL_HEADER = 'no-store';
const isDev = process.env.NODE_ENV !== 'production';

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
  nominatimUrl.searchParams.set('lat', latitude.toString());
  nominatimUrl.searchParams.set('lon', longitude.toString());

  try {
    const upstreamResponse = await fetch(nominatimUrl, {
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!upstreamResponse.ok) {
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
  } catch {
    return buildErrorResponse(502, 'Reverse geocoding lookup failed.');
  }
}