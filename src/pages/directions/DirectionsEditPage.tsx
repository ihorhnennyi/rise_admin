import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { apiFetch, ApiError } from '@admin/api/http'
import type { Direction } from '@admin/types/directions'
import { Button } from '@admin/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@admin/components/ui/card'
import { Input } from '@admin/components/ui/input'
import { Label } from '@admin/components/ui/label'
import { Textarea } from '@admin/components/ui/textarea'
import { API_BASE_URL } from '@admin/api/config'
import { AlertDialog } from '@admin/components/ui/alert-dialog'
import { toastError, toastInfo, toastSuccess } from '@admin/lib/toast'

export function DirectionsEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const directionId = id ?? ''

  const [direction, setDirection] = useState<Direction | null>(null)
  const [lang, setLang] = useState<'uk' | 'en'>('uk')
  const [titleUk, setTitleUk] = useState('')
  const [titleEn, setTitleEn] = useState('')
  const [excerptUk, setExcerptUk] = useState('')
  const [excerptEn, setExcerptEn] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const coverInputRef = useRef<HTMLInputElement | null>(null)

  const coverUrl = useMemo(() => direction?.coverImageUrl ?? null, [direction?.coverImageUrl])

  useEffect(() => {
    let cancelled = false
    async function run() {
      try {
        const d = await apiFetch<Direction>(`/directions/${directionId}`)
        if (cancelled) return
        setDirection(d)
        setTitleUk((d.titleUk ?? d.title ?? '').toString())
        setTitleEn((d.titleEn ?? '').toString())
        setExcerptUk((d.excerptUk ?? d.excerpt ?? '').toString())
        setExcerptEn((d.excerptEn ?? '').toString())
      } catch (e) {
        if (cancelled) return
        setDirection(null)
        if (e instanceof ApiError && e.status === 401) return
        toastError('Помилка', 'Не вдалося завантажити напрямок.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    if (directionId) void run()
    return () => {
      cancelled = true
    }
  }, [directionId])

  async function save() {
    setSaving(true)
    try {
      const updated = await apiFetch<Direction>(`/directions/${directionId}`, {
        method: 'PATCH',
        json: {
          titleUk,
          titleEn,
          excerptUk,
          excerptEn,
        },
      })
      setDirection(updated)
      toastSuccess('Збережено', 'Зміни збережено.')
    } catch {
      toastError('Помилка', 'Не вдалося зберегти.')
    } finally {
      setSaving(false)
    }
  }

  async function onUploadCover(file: File | null) {
    if (!file) return
    setUploadingCover(true)
    try {
      toastInfo('Завантаження…', 'Картинка картки')
      const form = new FormData()
      form.append('image', file)
      const updated = await apiFetch<Direction>(`/directions/${directionId}/cover`, {
        method: 'POST',
        body: form,
      })
      setDirection(updated)
      toastSuccess('Завантажено', 'Картинка оновлена.')
    } catch {
      toastError('Помилка', 'Не вдалося завантажити картинку.')
    } finally {
      setUploadingCover(false)
      if (coverInputRef.current) coverInputRef.current.value = ''
    }
  }

  if (loading) return <div className="text-sm text-[hsl(var(--muted-foreground))]">Loading…</div>

  if (!direction) {
    return (
      <div className="space-y-3">
        <div className="text-sm text-red-400">Не знайдено.</div>
        <Button asChild variant="secondary" size="sm">
          <Link to="/directions">Назад</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-28">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[hsl(var(--foreground))]">
            Редагування напрямку
          </h1>
          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
            ID: <span className="font-mono">{directionId}</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant={lang === 'uk' ? 'default' : 'secondary'} size="sm" onClick={() => setLang('uk')}>
            UA
          </Button>
          <Button type="button" variant={lang === 'en' ? 'default' : 'secondary'} size="sm" onClick={() => setLang('en')}>
            EN
          </Button>
          <Button type="button" disabled={saving} onClick={() => void save()}>
            {saving ? 'Зберігаю…' : 'Зберегти'}
          </Button>
          <Button variant="secondary" onClick={() => setDeleteOpen(true)}>
            Видалити
          </Button>
          <Button variant="secondary" onClick={() => navigate('/directions')}>
            До списку
          </Button>
        </div>
      </div>

      <AlertDialog
        open={deleteOpen}
        title="Видалити напрямок?"
        description="Картка зникне з головної сторінки."
        cancelText="Скасувати"
        confirmText={deleting ? 'Видаляю…' : 'Видалити'}
        destructive
        confirmDisabled={deleting}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={async () => {
          setDeleting(true)
          try {
            await apiFetch(`/directions/${directionId}`, { method: 'DELETE' })
            toastSuccess('Видалено', 'Напрямок видалено.')
            navigate('/directions', { replace: true })
          } catch {
            toastError('Помилка', 'Не вдалося видалити.')
          } finally {
            setDeleting(false)
            setDeleteOpen(false)
          }
        }}
      />

      <Card className="bg-[hsl(var(--card)/0.65)] backdrop-blur">
        <CardHeader>
          <CardTitle>Картка напрямку</CardTitle>
          <CardDescription>Заголовок, опис, зображення. Проєкт прив’язується в розділі «Проєкти».</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label>Заголовок</Label>
            <Input
              value={lang === 'uk' ? titleUk : titleEn}
              onChange={(e) => (lang === 'uk' ? setTitleUk(e.target.value) : setTitleEn(e.target.value))}
            />
          </div>
          <div className="grid gap-2">
            <Label>Опис</Label>
            <Textarea
              value={lang === 'uk' ? excerptUk : excerptEn}
              onChange={(e) => (lang === 'uk' ? setExcerptUk(e.target.value) : setExcerptEn(e.target.value))}
              rows={4}
            />
          </div>
          <div className="grid gap-2">
            <Label>Зображення</Label>
            {coverUrl ? (
              <img
                src={`${API_BASE_URL.replace(/\/api$/, '')}${coverUrl}`}
                alt=""
                className="max-h-56 rounded-lg border object-cover"
              />
            ) : null}
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              disabled={uploadingCover}
              className="text-sm"
              onChange={(e) => void onUploadCover(e.target.files?.[0] ?? null)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
