// Date-only helpers (YYYY-MM-DD) that don't depend on the device time zone, so the server can use them too.

export function shiftDate(iso: string, days: number): string {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
