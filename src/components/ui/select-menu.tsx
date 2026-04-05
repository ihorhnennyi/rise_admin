import * as React from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '@admin/lib/utils'

export type SelectMenuOption = { value: string; label: string }

export type SelectMenuProps = {
  id?: string
  value: string
  onValueChange: (value: string) => void
  options: SelectMenuOption[]
  disabled?: boolean
  className?: string
  placeholder?: string
}

const triggerClass =
  'flex h-10 w-full items-center justify-between gap-2 rounded-md border border-[hsl(var(--input))] bg-transparent px-3 py-2 text-left text-sm text-[hsl(var(--foreground))] shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(var(--background))] disabled:cursor-not-allowed disabled:opacity-50'

export function SelectMenu({
  id,
  value,
  onValueChange,
  options,
  disabled,
  className,
  placeholder = 'Оберіть…',
}: SelectMenuProps) {
  const [open, setOpen] = React.useState(false)
  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const menuRef = React.useRef<HTMLDivElement>(null)
  const [menuRect, setMenuRect] = React.useState({ top: 0, left: 0, width: 0 })

  const selected = options.find((o) => o.value === value)
  const label = selected?.label ?? (value || placeholder)

  const updatePosition = React.useCallback(() => {
    const el = triggerRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const gap = 4
    setMenuRect({
      top: r.bottom + gap,
      left: r.left,
      width: Math.max(r.width, 160),
    })
  }, [])

  React.useLayoutEffect(() => {
    if (!open) return
    updatePosition()
    const onScroll = () => updatePosition()
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onScroll)
    }
  }, [open, updatePosition])

  React.useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node
      if (triggerRef.current?.contains(t) || menuRef.current?.contains(t)) return
      setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const menu = open ? (
    <div
      ref={menuRef}
      role="listbox"
      className="fixed z-[200] max-h-60 overflow-auto rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--popover))] py-1 shadow-lg outline-none"
      style={{
        top: menuRect.top,
        left: menuRect.left,
        width: menuRect.width,
        maxHeight: 'min(15rem, calc(100vh - 1rem))',
      }}
    >
      {options.map((opt) => {
        const isSel = opt.value === value
        return (
          <button
            key={opt.value}
            type="button"
            role="option"
            aria-selected={isSel}
            className={cn(
              'flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors',
              isSel
                ? 'bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--foreground))]'
                : 'text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))]',
            )}
            onClick={() => {
              onValueChange(opt.value)
              setOpen(false)
            }}
          >
            <span className="flex h-4 w-4 shrink-0 items-center justify-center">
              {isSel ? <Check className="h-3.5 w-3.5 text-[hsl(var(--primary))]" strokeWidth={2.5} /> : null}
            </span>
            <span className="min-w-0 flex-1 truncate">{opt.label}</span>
          </button>
        )
      })}
    </div>
  ) : null

  return (
    <div className={cn('relative', className)}>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        disabled={disabled || options.length === 0}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={cn(triggerClass, open && 'ring-2 ring-[hsl(var(--ring))] ring-offset-2 ring-offset-[hsl(var(--background))]')}
        onClick={() => {
          if (disabled || options.length === 0) return
          setOpen((o) => !o)
        }}
      >
        <span className="min-w-0 flex-1 truncate">{options.length === 0 ? '—' : label}</span>
        <ChevronDown
          className={cn('h-4 w-4 shrink-0 text-[hsl(var(--muted-foreground))] transition-transform', open && 'rotate-180')}
          aria-hidden
        />
      </button>
      {typeof document !== 'undefined' && menu ? createPortal(menu, document.body) : null}
    </div>
  )
}
