import { NextRequest, NextResponse } from 'next/server';
import { model } from 'geomagnetism';

import { applySecurityHeaders, stripFingerprintingHeaders } from '@/lib/security-headers';

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

  try {
    const declination = model(new Date(), { allowOutOfBoundsModel: true }).point([latitude, longitude]).decl;

    const response = NextResponse.json(
      { declination },
      {
        headers: {
          'Cache-Control': CACHE_CONTROL_HEADER,
        },
      }
    );

    stripFingerprintingHeaders(response.headers);
    applySecurityHeaders(response.headers, isDev);

    return response;
  } catch {
    return buildErrorResponse(502, 'Declination lookup failed.');
  }
}