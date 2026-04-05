const UK_MAP: Record<string, string> = {
  а: 'a',
  б: 'b',
  в: 'v',
  г: 'h',
  ґ: 'g',
  д: 'd',
  е: 'e',
  є: 'ie',
  ж: 'zh',
  з: 'z',
  и: 'y',
  і: 'i',
  ї: 'i',
  й: 'i',
  к: 'k',
  л: 'l',
  м: 'm',
  н: 'n',
  о: 'o',
  п: 'p',
  р: 'r',
  с: 's',
  т: 't',
  у: 'u',
  ф: 'f',
  х: 'kh',
  ц: 'ts',
  ч: 'ch',
  ш: 'sh',
  щ: 'shch',
  ь: '',
  ю: 'iu',
  я: 'ia',
  "'": '',
  '’': '',
  'ʼ': '',
}

const RU_EXTRA: Record<string, string> = {
  э: 'e',
  ы: 'y',
  ъ: '',
  ё: 'e',
}

function translit(input: string) {
  const lower = (input ?? '').toString().toLowerCase()
  let out = ''
  for (const ch of lower) {
    if (UK_MAP[ch] !== undefined) out += UK_MAP[ch]
    else if (RU_EXTRA[ch] !== undefined) out += RU_EXTRA[ch]
    else out += ch
  }
  return out
}

/** Latin slug segment (EN or transliterated UA/RU). */
export function slugifySegment(input: string): string {
  const base = translit(input).trim()
  return base
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
}

/** Path like `/about-fund` from English (or Latin) label; empty if no slug. */
export function footerHrefFromEnLabel(labelEn: string): string {
  const slug = slugifySegment(labelEn)
  return slug ? `/${slug}` : ''
}
