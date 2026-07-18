import type { Cafe, WeekHours, DayHours } from './types';

export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}

/** First 1–2 initials from a name, for stamps/avatars/pins. */
export function monogram(name: string): string {
  const words = (name || 'Joe').replace(/^The\s+/i, '').trim().split(/\s+/);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

export function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch { return iso; }
}

export function formatStampDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }).replace(/\//g, '.');
  } catch { return iso; }
}

export function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const s = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60); if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24); if (d < 7) return `${d}d`;
  const w = Math.floor(d / 7); if (w < 5) return `${w}w`;
  return formatDate(iso);
}

export function coordLabel(lat: number, lng: number): string {
  const ns = lat >= 0 ? 'N' : 'S';
  const ew = lng >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(4)}\u00B0${ns} ${Math.abs(lng).toFixed(4)}\u00B0${ew}`;
}

/** Deterministic warm gradient per seed for image fallbacks (brand palette). */
export function fallbackGradient(seed: string): string {
  const palettes = [
    ['#19452B', '#0F2E1C'], // racing
    ['#502A19', '#2E170D'], // coffee
    ['#1B3A73', '#0E2149'], // navy
    ['#5C4E19', '#3A310F'], // gold
    ['#B96912', '#7A430B'], // amber
  ];
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const [a, b] = palettes[h % palettes.length];
  return `linear-gradient(135deg, ${a}, ${b})`;
}

const DAY_KEYS: (keyof WeekHours)[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

function minsNow(): number { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); }
function toMins(hhmm: string): number { const [h, m] = hhmm.split(':').map(Number); return h * 60 + (m || 0); }

/** true / false / null (unknown) for whether a café is open right now. */
export function isOpenNow(cafe: Pick<Cafe, 'hoursStructured'>): boolean | null {
  const wk = cafe.hoursStructured;
  if (!wk) return null;
  const today = wk[DAY_KEYS[new Date().getDay()]] as DayHours;
  if (!today) return false;
  const now = minsNow();
  const open = toMins(today.open);
  let close = toMins(today.close);
  if (close <= open) close += 24 * 60; // past-midnight
  const n = now < open ? now + 24 * 60 : now;
  return n >= open && n < close;
}

export function openLabel(cafe: Pick<Cafe, 'hoursStructured' | 'hours'>): string {
  const state = isOpenNow(cafe);
  if (state === null) return cafe.hours || 'Hours vary';
  const wk = cafe.hoursStructured!;
  const today = wk[DAY_KEYS[new Date().getDay()]] as DayHours;
  if (state) return today ? `Open now · until ${fmt(today.close)}` : 'Open now';
  return today ? `Closed · opens ${fmt(today.open)}` : 'Closed today';
}

function fmt(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return m ? `${h12}:${String(m).padStart(2, '0')} ${ampm}` : `${h12} ${ampm}`;
}

/** Haversine distance in miles. */
export function distanceMiles(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 3958.8;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

/** Group flat tag names into their categories using a tag→category lookup. */
export function groupTags(tags: string[], lookup: Record<string, string>): { category: string; tags: string[] }[] {
  const map = new Map<string, string[]>();
  for (const t of tags) {
    const cat = lookup[t] || 'More';
    if (!map.has(cat)) map.set(cat, []);
    map.get(cat)!.push(t);
  }
  return Array.from(map.entries()).map(([category, tags]) => ({ category, tags }));
}
