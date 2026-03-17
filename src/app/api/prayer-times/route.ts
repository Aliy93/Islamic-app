import { NextRequest, NextResponse } from 'next/server';

import { parsePrayerTimesApiResponse } from '@/lib/external-data';
import { applySecurityHeaders, stripFingerprintingHeaders } from '@/lib/security-headers';

const ALADHAN_API_BASE_URL = 'https://api.aladhan.com/v1/timings';
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

function parseFiniteNumber(value: string | null, min: number, max: number) {
  if (!value) return null;

  const parsedValue = Number(value);
  if (!Number.isFinite(parsedValue) || parsedValue < min || parsedValue > max) {
    return null;
  }

  return parsedValue;
}

function parsePositiveInteger(value: string | null) {
  if (!value) return null;

  const parsedValue = Number(value);
  if (!Number.isInteger(parsedValue) || parsedValue < 0) {
    return null;
  }

  return parsedValue;
}

export async function GET(request: NextRequest) {
  const timestamp = parsePositiveInteger(request.nextUrl.searchParams.get('timestamp'));
  const latitude = parseFiniteNumber(request.nextUrl.searchParams.get('latitude'), -90, 90);
  const longitude = parseFiniteNumber(request.nextUrl.searchParams.get('longitude'), -180, 180);
  const method = parsePositiveInteger(request.nextUrl.searchParams.get('method'));

  if (timestamp === null || latitude === null || longitude === null || method === null) {
    return buildErrorResponse(400, 'Invalid prayer time parameters.');
  }

  const alAdhanUrl = new URL(`${ALADHAN_API_BASE_URL}/${timestamp}`);
  alAdhanUrl.searchParams.set('latitude', latitude.toString());
  alAdhanUrl.searchParams.set('longitude', longitude.toString());
  alAdhanUrl.searchParams.set('method', method.toString());

  try {
    const upstreamResponse = await fetch(alAdhanUrl, {
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!upstreamResponse.ok) {
      return buildErrorResponse(502, 'Prayer time lookup failed.');
    }

    const payload = await upstreamResponse.json();
    const timings = parsePrayerTimesApiResponse(payload);

    const jsonResponse = NextResponse.json(
      { timings },
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
    return buildErrorResponse(502, 'Prayer time lookup failed.');
  }
}