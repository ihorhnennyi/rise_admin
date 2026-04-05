import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { cn } from '@admin/lib/utils'
import type { ToastPayload, ToastVariant } from '@admin/lib/toast'
import { onToast } from '@admin/lib/toast'
import { Button } from '@admin/components/ui/button'

type ToastItem = Required<Pick<ToastPayload, 'title'>> &
  ToastPayload & {
    id: string
    createdAt: number
    variant: ToastVariant
    durationMs: number
  }

function variantClasses(v: ToastVariant) {
  if (v === 'success') return 'border-emerald-500/30 bg-emerald-500/10'
  if (v === 'error') return 'border-red-500/30 bg-red-500/10'
  return 'border-[hsl(var(--border))] bg-[hsl(var(--card)/0.75)]'
}

export function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([])

  useEffect(() => {
    return onToast((p) => {
      const id = p.id ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`
      const item: ToastItem = {
        id,
        createdAt: Date.now(),
        title: p.title,
        description: p.description,
        variant: p.variant ?? 'info',
        durationMs: p.durationMs ?? 2500,
      }
      setItems((prev) => [...prev, item].slice(-4))
      window.setTimeout(() => {
        setItems((prev) => prev.filter((x) => x.id !== id))
      }, item.durationMs)
    })
  }, [])

  if (items.length === 0) return null

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-[340px] flex-col gap-2">
      {items.map((t) => (
        <div
          key={t.id}
          className={cn(
            'pointer-events-auto rounded-xl border p-3 shadow-lg backdrop-blur',
            variantClasses(t.variant),
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate text-sm font-medium text-[hsl(var(--foreground))]">{t.title}</div>
              {t.description ? (
                <div className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">{t.description}</div>
              ) : null}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 px-0"
              aria-label="Close"
              onClick={() => setItems((prev) => prev.filter((x) => x.id !== t.id))}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}

