import { z } from 'zod';

export const LOCATION_STORAGE_PRECISION = 3;

export const locationSchema = z.object({
  latitude: z.number().finite().min(-90).max(90),
  longitude: z.number().finite().min(-180).max(180),
});

export type StoredLocation = z.infer<typeof locationSchema>;

function roundCoordinate(value: number): number {
  return Number(value.toFixed(LOCATION_STORAGE_PRECISION));
}

export function normalizeLocation(location: StoredLocation): StoredLocation {
  return {
    latitude: roundCoordinate(location.latitude),
    longitude: roundCoordinate(location.longitude),
  };
}

export function parseStoredLocation(rawValue: string | null): StoredLocation | null {
  if (!rawValue) return null;

  try {
    const parsed = JSON.parse(rawValue) as unknown;
    const result = locationSchema.safeParse(parsed);
    return result.success ? normalizeLocation(result.data) : null;
  } catch {
    return null;
  }
}