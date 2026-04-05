import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@admin/lib/utils'

const actionBtn =
  'min-h-10 min-w-[4.5rem] rounded-lg px-3 py-2 text-[15px] font-normal transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-2'

/**
 * Уніфіковане підтвердження: біла картка, затемнення, роздільник, текстові кнопки (як системний alert).
 */
export function AlertDialog({
  open,
  title,
  description,
  confirmText = 'OK',
  cancelText = 'Скасувати',
  destructive,
  confirmDisabled,
  onConfirm,
  onCancel,
}: {
  open: boolean
  title: string
  description?: string
  confirmText?: string
  cancelText?: string
  /** Текст підтвердження акцентом «небезпечної» дії (червоний) */
  destructive?: boolean
  confirmDisabled?: boolean
  onConfirm: () => void | Promise<void>
  onCancel: () => void
}) {
  useEffect(() => {
    if (!open) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onCancel])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  if (!open) return null

  const message = (
    <div className="px-5 pb-4 pt-5 text-center">
      {description ? (
        <>
          <div id="alert-dialog-title" className="text-[15px] font-semibold leading-snug text-[hsl(var(--foreground))]">
            {title}
          </div>
          <div id="alert-dialog-desc" className="mt-2 text-[15px] leading-snug text-[hsl(var(--foreground))]">
            {description}
          </div>
        </>
      ) : (
        <div id="alert-dialog-title" className="text-[15px] leading-snug text-[hsl(var(--foreground))]">
          {title}
        </div>
      )}
    </div>
  )

  return createPortal(
    <div
      className="fixed inset-0 z-[350]"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="alert-dialog-title"
      aria-describedby={description ? 'alert-dialog-desc' : undefined}
    >
      <button
        type="button"
        className="absolute inset-0 h-full w-full cursor-default bg-black/45"
        aria-label="Закрити"
        onMouseDown={(e) => {
          e.preventDefault()
          onCancel()
        }}
      />
      <div className="pointer-events-none absolute inset-0 grid place-items-center p-4">
        <div
          className={cn(
            'pointer-events-auto w-full max-w-[400px] overflow-hidden rounded-[14px]',
            'border border-[hsl(var(--border))] bg-[hsl(var(--background))] shadow-[0_12px_40px_rgba(0,0,0,0.18)]',
          )}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {message}
          <div className="h-px w-full bg-[hsl(var(--border))]" />
          <div className="flex flex-wrap items-center justify-end gap-1 px-3 py-2 sm:gap-2">
            <button
              type="button"
              className={cn(
                actionBtn,
                'text-[hsl(211_90%_48%)] hover:bg-[hsl(var(--muted)/0.45)] active:bg-[hsl(var(--muted)/0.65)]',
              )}
              onClick={onCancel}
            >
              {cancelText}
            </button>
            <button
              type="button"
              className={cn(
                actionBtn,
                destructive
                  ? 'text-[hsl(0_72%_51%)] hover:bg-[hsl(var(--destructive)/0.08)] active:bg-[hsl(var(--destructive)/0.14)]'
                  : 'text-[hsl(211_90%_48%)] hover:bg-[hsl(var(--muted)/0.45)] active:bg-[hsl(var(--muted)/0.65)]',
              )}
              disabled={confirmDisabled}
              onClick={() => void onConfirm()}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
