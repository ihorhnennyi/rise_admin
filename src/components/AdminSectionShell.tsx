import * as React from 'react'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardTitle } from '@admin/components/ui/card'
import { readStoredSectionOpen, writeStoredSectionOpen } from '@admin/lib/section-storage'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@admin/lib/utils'

export type AdminSectionShellProps = {
  icon: React.ElementType
  title: string
  description: string
  defaultOpen?: boolean
  /** Якщо задано, стан згортання зберігається після перезавантаження сторінки */
  storageKey?: string
  children: React.ReactNode
}

export function AdminSectionShell({
  icon: Icon,
  title,
  description,
  defaultOpen = true,
  storageKey,
  children,
}: AdminSectionShellProps) {
  const [open, setOpen] = useState(() =>
    storageKey ? readStoredSectionOpen(storageKey, defaultOpen) : defaultOpen,
  )

  useEffect(() => {
    if (!storageKey) return
    writeStoredSectionOpen(storageKey, open)
  }, [storageKey, open])

  return (
    <Card className="overflow-hidden border-[hsl(var(--border))] bg-[hsl(var(--card)/0.65)] shadow-sm backdrop-blur">
      <button
        type="button"
        className="flex w-full items-start gap-4 p-5 text-left transition-colors hover:bg-[hsl(var(--muted)/0.15)] sm:p-6"
        onClick={() => setOpen((o) => !o)}
      >
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.35)]">
          <Icon className="h-6 w-6 opacity-90" strokeWidth={1.75} />
        </div>
        <div className="min-w-0 flex-1">
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
          <CardDescription className="mt-1 text-[13px] leading-relaxed">{description}</CardDescription>
        </div>
        <span className="shrink-0 text-[hsl(var(--muted-foreground))]">
          {open ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </span>
      </button>
      <div className={cn('border-t border-[hsl(var(--border))]', !open && 'hidden')}>
        <CardContent className="space-y-4 p-5 pt-4 sm:p-6 sm:pt-5">{children}</CardContent>
      </div>
    </Card>
  )
}
