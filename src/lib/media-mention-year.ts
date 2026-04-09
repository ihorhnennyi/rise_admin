/** Рік для бейджа ЗМІ зберігається як ISO дата 1 січня обраного року (UTC). */

export function isoToYear(iso: string | undefined): number {
  if (!iso) return new Date().getFullYear()
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? new Date().getFullYear() : d.getFullYear()
}

export function yearToPublishedIsoUtc(year: number): string {
  const y = Math.min(9999, Math.max(1000, Math.floor(year)))
  return `${y}-01-01T12:00:00.000Z`
}
