export type IslamicEvent = {
  month: number;
  day: number;
  name: string;
  description: string;
};

// Note: Hijri months are 1-indexed (1 = Muharram, ..., 12 = Dhu al-Hijjah)
// These are some of the most commonly observed dates.
export const islamicEvents: IslamicEvent[] = [
  {
    month: 1,
    day: 1,
    name: "Islamic New Year",
    description: "The start of the Hijri new year, marking the migration of the Prophet Muhammad from Mecca to Medina.",
  },
  {
    month: 1,
    day: 10,
    name: "Ashura",
    description: "A day of fasting, commemorating when God saved Moses and the Israelites from their foe.",
  },
  {
    month: 3,
    day: 12,
    name: "Mawlid al-Nabi",
    description: "The observance of the birthday of the Prophet Muhammad.",
  },
  {
    month: 7,
    day: 27,
    name: "Isra and Mi'raj",
    description: "Commemorates the Prophet's nighttime journey from Mecca to Jerusalem and his ascension.",
  },
  {
    month: 9,
    day: 1,
    name: "Ramadan Begins",
    description: "The first day of the holy month of fasting, prayer, and reflection.",
  },
  {
    month: 9,
    day: 27,
    name: "Laylat al-Qadr",
    description: "The 'Night of Power,' one of the most sacred nights in the last ten days of Ramadan.",
  },
  {
    month: 10,
    day: 1,
    name: "Eid al-Fitr",
    description: "The 'Festival of Breaking the Fast,' marking the end of Ramadan with celebration and charity.",
  },
  {
    month: 12,
    day: 9,
    name: "Day of Arafah",
    description: "The second day of Hajj pilgrimage. A day of repentance and supplication.",
  },
  {
    month: 12,
    day: 10,
    name: "Eid al-Adha",
    description: "The 'Festival of Sacrifice,' which honors Ibrahim's willingness to sacrifice his son.",
  },
];

export function getEventForDate(hijriMonth: number, hijriDay: number): IslamicEvent | undefined {
  return islamicEvents.find(event => event.month === hijriMonth && event.day === hijriDay);
}
