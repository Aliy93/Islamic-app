import { z } from 'zod';

const prayerTimesApiSchema = z.object({
  code: z.literal(200),
  data: z.object({
    timings: z.object({
      Fajr: z.string(),
      Sunrise: z.string(),
      Dhuhr: z.string(),
      Asr: z.string(),
      Maghrib: z.string(),
      Isha: z.string(),
    }),
  }),
});

const reverseGeocodeSchema = z.object({
  address: z.object({
    city: z.string().optional(),
    town: z.string().optional(),
    village: z.string().optional(),
    suburb: z.string().optional(),
    state_district: z.string().optional(),
    country: z.string().optional(),
  }).optional(),
});

export function parsePrayerTimesApiResponse(payload: unknown) {
  return prayerTimesApiSchema.parse(payload).data.timings;
}

export function parseReverseGeocodeLabel(payload: unknown): string | null {
  const result = reverseGeocodeSchema.safeParse(payload);
  if (!result.success || !result.data.address) return null;

  const { city, town, village, suburb, state_district, country } = result.data.address;
  const locality = city || town || village || suburb || state_district;

  if (locality && country) {
    return `${locality}, ${country}`;
  }

  return country ?? null;
}