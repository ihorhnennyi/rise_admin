import { Save } from 'lucide-react'
import { Button } from '@admin/components/ui/button'

const DEFAULT_MESSAGE =
  'Після правок клікни в інше поле або «Зберегти». Автозбереження ~0,4 с після набору. Не закривай вкладку одразу після введення тексту.'

type AdminPersistFooterProps = {
  saving: boolean
  onSave: () => void
  disabled?: boolean
  message?: string
}

/** Закріплена панель збереження (як на сторінці футера) — для усіх довгих форм в адмінці. */
export function AdminPersistFooter({ saving, onSave, disabled, message = DEFAULT_MESSAGE }: AdminPersistFooterProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-[hsl(var(--border))] bg-[hsl(var(--background)/0.96)] backdrop-blur md:left-72">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-6 py-3">
        <p className="max-w-xl text-sm text-[hsl(var(--muted-foreground))]">{message}</p>
        <Button type="button" size="default" disabled={disabled ?? saving} onClick={onSave}>
          <Save className="size-4" aria-hidden />
          {saving ? 'Збереження…' : 'Зберегти'}
        </Button>
      </div>
    </div>
  )
}
