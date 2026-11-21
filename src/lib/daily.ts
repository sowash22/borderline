import maps from "./maps.json";

export type DailyMap = (typeof maps)[number];

export function utcDay(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

// FNV-1a. Same day always picks the same country on every device.
export function dailyIndex(day: string, count: number): number {
  let hash = 2166136261;
  for (let i = 0; i < day.length; i++) {
    hash ^= day.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) % count;
}

export function dailyCountry(day = utcDay()): DailyMap {
  return maps[dailyIndex(day, maps.length)];
}

export function shiftDay(day: string, delta: number): string {
  const date = new Date(`${day}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + delta);
  return date.toISOString().slice(0, 10);
}

export function yesterdayCountry(day = utcDay()): DailyMap {
  return dailyCountry(shiftDay(day, -1));
}
