// Small, dependency-free formatters (same output on iOS, Android and web).

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const pad = (n: number) => String(n).padStart(2, "0");

export function formatEUR(amount: number): string {
  const sign = amount < 0 ? "−" : "";
  return `${sign}€${Math.abs(amount).toFixed(2)}`;
}

export function formatTime(ts: number): string {
  const d = new Date(ts);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function formatDate(ts: number): string {
  const d = new Date(ts);
  return `${WEEKDAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

export function formatDateLong(ts: number): string {
  const d = new Date(ts);
  return `${WEEKDAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatDateTime(ts: number): string {
  return `${formatDate(ts)} · ${formatTime(ts)}`;
}

/** "Today", "Tomorrow" or "Wed 19". */
export function formatDayChip(ts: number, now = Date.now()): { top: string; bottom: string } {
  const d = new Date(ts);
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((new Date(d).setHours(0, 0, 0, 0) - today.getTime()) / 86_400_000);
  const top = diff === 0 ? "Today" : diff === 1 ? "Tomorrow" : WEEKDAYS[d.getDay()];
  return { top, bottom: `${d.getDate()} ${MONTHS[d.getMonth()]}` };
}

export function formatPeriod(start: number, end: number): string {
  const sameDay = new Date(start).toDateString() === new Date(end).toDateString();
  return sameDay
    ? `${formatDate(start)}, ${formatTime(start)}–${formatTime(end)}`
    : `${formatDateTime(start)} → ${formatDateTime(end)}`;
}

export function formatDistance(meters: number): string {
  const km = meters / 1000;
  return km < 10 ? `${km.toFixed(1)} km` : `${Math.round(km)} km`;
}

export function formatDuration(seconds: number): string {
  const totalMin = Math.round(seconds / 60);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

export function formatCountdown(ms: number): string {
  if (ms <= 0) return "0 s";
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (d > 0) return `${d} d ${h} h ${pad(m)} m`;
  if (h > 0) return `${h} h ${pad(m)} m ${pad(sec)} s`;
  return `${m} m ${pad(sec)} s`;
}

export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}
