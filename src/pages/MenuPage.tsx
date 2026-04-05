import { useCallback, useEffect, useMemo, useState } from 'react'
import { apiFetch, ApiError } from '@admin/api/http'
import type { MenuItem } from '@admin/types/menu'
import { Button } from '@admin/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@admin/components/ui/card'
import { Input } from '@admin/components/ui/input'
import { Label } from '@admin/components/ui/label'
import { AlertDialog } from '@admin/components/ui/alert-dialog'
import { slugifySegment } from '@admin/lib/slug'
import { toastError, toastSuccess } from '@admin/lib/toast'
import { Save, Trash2 } from 'lucide-react'

export function MenuPage() {
  const [items, setItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const [newUk, setNewUk] = useState('')
  const [newEn, setNewEn] = useState('')
  const [adding, setAdding] = useState(false)

  const [ukDrafts, setUkDrafts] = useState<Record<string, string>>({})
  const [enDrafts, setEnDrafts] = useState<Record<string, string>>({})

  const newSlug = useMemo(() => slugifySegment(newEn.trim() ? newEn : newUk), [newUk, newEn])

  const load = useCallback(async () => {
    try {
      const data = await apiFetch<MenuItem[]>('/menu/admin')
      setItems(data)
      const uk: Record<string, string> = {}
      const en: Record<string, string> = {}
      for (const m of data) {
        uk[m._id] = m.titleUk ?? ''
        en[m._id] = m.titleEn ?? ''
      }
      setUkDrafts(uk)
      setEnDrafts(en)
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) return
      toastError('Помилка', 'Не вдалося завантажити елементи меню.')
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function addItem(e: React.FormEvent) {
    e.preventDefault()
    const titleUk = newUk.trim()
    const titleEn = newEn.trim()
    if (!titleUk) {
      toastError('Помилка', 'Назва (UA) обовʼязкова.')
      return
    }
    setAdding(true)
    try {
      await apiFetch<MenuItem>('/menu', {
        method: 'POST',
        json: { titleUk, titleEn: titleEn || undefined },
      })
      setNewUk('')
      setNewEn('')
      toastSuccess('Створено', 'Елемент меню додано.')
      await load()
    } catch {
      toastError('Помилка', 'Не вдалося створити.')
    } finally {
      setAdding(false)
    }
  }

  async function save(id: string) {
    const titleUk = (ukDrafts[id] ?? '').trim()
    const titleEn = (enDrafts[id] ?? '').trim()
    if (!titleUk) {
      toastError('Помилка', 'Назва (UA) обовʼязкова.')
      return
    }
    setSavingId(id)
    try {
      await apiFetch<MenuItem>(`/menu/${id}`, { method: 'PATCH', json: { titleUk, titleEn } })
      toastSuccess('Збережено', 'Оновлено.')
      await load()
    } catch {
      toastError('Помилка', 'Не вдалося зберегти.')
    } finally {
      setSavingId(null)
    }
  }

  async function removeConfirmed(id: string) {
    setSavingId(id)
    try {
      await apiFetch(`/menu/${id}`, { method: 'DELETE' })
      toastSuccess('Видалено', 'Елемент меню видалено.')
      await load()
    } catch {
      toastError('Помилка', 'Не вдалося видалити.')
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[hsl(var(--foreground))]">Елементи меню</h1>
        <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
          Назви (UA/EN). <b>Slug</b> генерується автоматично при створенні.
        </p>
      </div>

      <Card className="bg-[hsl(var(--card)/0.65)] backdrop-blur">
        <CardHeader>
          <CardTitle>Додати елемент</CardTitle>
          <CardDescription>
            UA обовʼязково. Slug генерується з <b>англійської назви</b>, якщо вона заповнена — інакше з UA.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end" onSubmit={addItem}>
            <div className="grid min-w-[220px] flex-1 gap-2">
              <Label htmlFor="new-uk">Назва (UA)</Label>
              <Input id="new-uk" value={newUk} onChange={(e) => setNewUk(e.target.value)} />
            </div>
            <div className="grid min-w-[220px] flex-1 gap-2">
              <Label htmlFor="new-en">Name (EN)</Label>
              <Input id="new-en" value={newEn} onChange={(e) => setNewEn(e.target.value)} />
            </div>
            <div className="grid min-w-[220px] flex-1 gap-2">
              <Label>Slug (preview)</Label>
              <Input value={newSlug} readOnly />
            </div>
            <Button type="submit" disabled={adding}>
              {adding ? 'Додавання…' : 'Додати'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {loading ? (
        <div className="text-sm text-[hsl(var(--muted-foreground))]">Завантаження…</div>
      ) : items.length === 0 ? (
        <Card className="bg-[hsl(var(--card)/0.65)] backdrop-blur">
          <CardHeader>
            <CardTitle>Поки що порожньо</CardTitle>
            <CardDescription>Додай перший елемент меню.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((m) => (
            <Card key={m._id} className="bg-[hsl(var(--card)/0.65)] backdrop-blur">
              <CardHeader className="space-y-1 pb-2">
                <CardTitle className="text-base">Menu item</CardTitle>
                <CardDescription className="text-xs">
                  Slug: <code className="text-xs">{m.slug}</code>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-2">
                  <Label htmlFor={`uk-${m._id}`}>Назва (UA)</Label>
                  <Input
                    id={`uk-${m._id}`}
                    value={ukDrafts[m._id] ?? ''}
                    onChange={(e) => setUkDrafts((p) => ({ ...p, [m._id]: e.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor={`en-${m._id}`}>Name (EN)</Label>
                  <Input
                    id={`en-${m._id}`}
                    value={enDrafts[m._id] ?? ''}
                    onChange={(e) => setEnDrafts((p) => ({ ...p, [m._id]: e.target.value }))}
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    disabled={savingId === m._id}
                    onClick={() => void save(m._id)}
                  >
                    <Save className="size-4" aria-hidden />
                    <span className="sr-only">Зберегти</span>
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="text-red-600 hover:bg-red-500/10 hover:text-red-700"
                    disabled={savingId === m._id}
                    onClick={() => {
                      setDeleteId(m._id)
                      setDeleteOpen(true)
                    }}
                  >
                    <Trash2 className="size-4" aria-hidden />
                    <span className="sr-only">Видалити</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog
        open={deleteOpen}
        title="Видалити елемент меню?"
        description="Цю дію не можна скасувати."
        cancelText="Скасувати"
        confirmText={deleteId && savingId === deleteId ? 'Видаляю…' : 'Видалити'}
        destructive
        confirmDisabled={!deleteId}
        onCancel={() => {
          setDeleteOpen(false)
          setDeleteId(null)
        }}
        onConfirm={async () => {
          if (!deleteId) return
          await removeConfirmed(deleteId)
          setDeleteOpen(false)
          setDeleteId(null)
        }}
      />
    </div>
  )
}

