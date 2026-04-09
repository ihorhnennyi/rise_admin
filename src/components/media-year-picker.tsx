import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { cn } from '@admin/lib/utils'
import { Button } from '@admin/components/ui/button'

const MIN_YEAR = 1990

function maxYear(): number {
  return new Date().getFullYear() + 2
}

function decadeContaining(year: number): number {
  return Math.floor(year / 10) * 10
}

export type MediaYearPickerProps = {
  id?: string
  value: number
  onChange: (year: number) => void
  disabled?: boolean
  className?: string
}

/**
 * Вибір року для бейджа ЗМІ: один ряд років, перехід по десятиліттях стрілками.
 */
export function MediaYearPicker({ id, value, onChange, disabled, className }: MediaYearPickerProps) {
  const [open, setOpen] = useState(false)
  const [decadeStart, setDecadeStart] = useState(() => decadeContaining(value))
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setDecadeStart(decadeContaining(value))
  }, [value])

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  const maxY = maxYear()
  const years = Array.from({ length: 12 }, (_, i) => decadeStart + i)

  function shiftDecade(delta: number) {
    setDecadeStart((s) => {
      const next = s + delta * 10
      const cap = decadeContaining(maxY)
      const floor = decadeContaining(MIN_YEAR)
      return Math.min(cap, Math.max(floor, next))
    })
  }

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <Button
        id={id}
        type="button"
        variant="secondary"
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        className={cn(
          'h-11 w-full justify-start gap-2 rounded-xl border-[hsl(var(--border))] bg-[hsl(var(--background)/0.85)] px-3 text-left font-normal shadow-sm',
          'hover:bg-[hsl(var(--accent)/0.35)]',
          open && 'ring-2 ring-[hsl(var(--ring))] ring-offset-2 ring-offset-[hsl(var(--background))]'
        )}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <Calendar className="size-4 shrink-0 text-[hsl(var(--muted-foreground))]" aria-hidden />
        <span className="tabular-nums text-[hsl(var(--foreground))]">{value}</span>
        <span className="ml-auto text-xs text-[hsl(var(--muted-foreground))]">рік</span>
      </Button>

      {open ? (
        <div
          className="absolute left-0 top-[calc(100%+6px)] z-[100] w-full max-w-[420px]"
          role="dialog"
          aria-label="Оберіть рік"
        >
          <div
            className={cn(
              'overflow-hidden rounded-2xl border border-[hsl(var(--border))]',
              'bg-gradient-to-b from-[hsl(var(--card))] to-[hsl(var(--card)/0.92)]',
              'shadow-[0_20px_50px_-12px_rgba(0,0,0,0.35),0_0_0_1px_rgba(255,255,255,0.06)_inset]',
              'backdrop-blur-md'
            )}
          >
            <div className="flex items-center justify-between gap-2 border-b border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.25)] px-3 py-2.5">
              <button
                type="button"
                className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-[hsl(var(--foreground))] transition hover:bg-[hsl(var(--accent))] disabled:opacity-30"
                onClick={() => shiftDecade(-1)}
                disabled={decadeStart <= decadeContaining(MIN_YEAR)}
                aria-label="Попереднє десятиліття"
              >
                <ChevronLeft className="size-4" />
              </button>
              <span className="min-w-0 text-center text-sm font-semibold tabular-nums text-[hsl(var(--foreground))]">
                {decadeStart} — {decadeStart + 11}
              </span>
              <button
                type="button"
                className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-[hsl(var(--foreground))] transition hover:bg-[hsl(var(--accent))] disabled:opacity-30"
                onClick={() => shiftDecade(1)}
                disabled={decadeStart >= decadeContaining(maxY)}
                aria-label="Наступне десятиліття"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
            <div className="flex flex-nowrap gap-1 overflow-x-auto p-3 [scrollbar-width:thin]">
              {years.map((y) => {
                const selected = y === value
                const out = y < MIN_YEAR || y > maxY
                return (
                  <button
                    key={y}
                    type="button"
                    disabled={out}
                    onClick={() => {
                      if (out) return
                      onChange(y)
                      setOpen(false)
                    }}
                    className={cn(
                      'shrink-0 rounded-xl px-2.5 py-2 text-center text-sm font-medium tabular-nums transition',
                      'min-w-[3rem]',
                      out && 'cursor-not-allowed opacity-25',
                      selected && !out
                        ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] shadow-md'
                        : !out && 'text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))]'
                    )}
                  >
                    {y}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
