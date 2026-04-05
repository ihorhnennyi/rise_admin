import { useState } from 'react'
import { Button } from '@admin/components/ui/button'
import { Card, CardContent } from '@admin/components/ui/card'
import { HELP_SECTIONS, type HelpSection, type LocalizedString } from '@admin/pages/help-sections'

function pick(loc: LocalizedString, lang: 'uk' | 'en') {
  return lang === 'uk' ? loc.uk : loc.en
}

function SectionCard({ section, lang }: { section: HelpSection; lang: 'uk' | 'en' }) {
  const Icon = section.icon

  return (
    <Card className="overflow-hidden border-[hsl(var(--border))] bg-[hsl(var(--card)/0.65)] shadow-sm backdrop-blur transition-shadow hover:shadow-md">
      <CardContent className="p-0">
        <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-start sm:gap-6 sm:p-6">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.35)] text-[hsl(var(--foreground))]"
            aria-hidden
          >
            <Icon className="h-6 w-6 opacity-90" strokeWidth={1.75} />
          </div>
          <div className="min-w-0 flex-1 space-y-4">
            <h2 className="text-lg font-semibold leading-snug tracking-tight text-[hsl(var(--foreground))]">
              {pick(section.title, lang)}
            </h2>

            {section.paragraphs.length > 0 ? (
              <div className="space-y-3">
                {section.paragraphs.map((p, i) => (
                  <p
                    key={i}
                    className="text-[14px] leading-relaxed text-[hsl(var(--muted-foreground))]"
                  >
                    {pick(p, lang)}
                  </p>
                ))}
              </div>
            ) : null}

            {section.bullets && section.bullets.length > 0 ? (
              <ul className="space-y-3">
                {section.bullets.map((item, i) => (
                  <li key={i} className="flex gap-3 text-[14px] leading-relaxed">
                    <span
                      className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[hsl(var(--foreground))] opacity-70"
                      aria-hidden
                    />
                    <span className="text-[hsl(var(--muted-foreground))]">{pick(item, lang)}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>

        {section.subsections && section.subsections.length > 0 ? (
          <div className="border-t border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.12)] px-5 py-5 sm:px-6">
            <p className="mb-4 text-xs font-medium uppercase tracking-wide text-[hsl(var(--muted-foreground))]">
              {lang === 'uk' ? 'Підрозділи' : 'Subsections'}
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {section.subsections.map((sub, i) => (
                <div
                  key={`${section.id}-${i}`}
                  className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card)/0.8)] p-4 shadow-sm"
                >
                  <h3 className="text-sm font-semibold text-[hsl(var(--foreground))]">
                    {pick(sub.title, lang)}
                  </h3>
                  <div className="mt-2 space-y-2">
                    {sub.paragraphs.map((para, j) => (
                      <p
                        key={j}
                        className="text-[13px] leading-relaxed text-[hsl(var(--muted-foreground))]"
                      >
                        {pick(para, lang)}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

export function HelpPage() {
  const [lang, setLang] = useState<'uk' | 'en'>('uk')

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-10">
      <div className="flex flex-col gap-4 border-b border-[hsl(var(--border))] pb-8 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight text-[hsl(var(--foreground))]">
            Допомога
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">
            {lang === 'uk'
              ? 'Довідка для команди: як влаштована адмін-панель, мови, збереження та розділи меню. Без форм — лише зручні блоки.'
              : 'Team guide: how the admin panel works, languages, saving, and sidebar sections. No forms — just clear blocks.'}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button
            type="button"
            variant={lang === 'uk' ? 'default' : 'secondary'}
            size="sm"
            onClick={() => setLang('uk')}
          >
            UA
          </Button>
          <Button
            type="button"
            variant={lang === 'en' ? 'default' : 'secondary'}
            size="sm"
            onClick={() => setLang('en')}
          >
            EN
          </Button>
        </div>
      </div>

      <div className="grid gap-5">
        {HELP_SECTIONS.map((section) => (
          <SectionCard key={section.id} section={section} lang={lang} />
        ))}
      </div>
    </div>
  )
}
