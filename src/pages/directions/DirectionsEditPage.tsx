import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { apiFetch, ApiError } from '@admin/api/http'
import type { Direction, DirectionImpactCircle } from '@admin/types/directions'
import { Button } from '@admin/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@admin/components/ui/card'
import { Input } from '@admin/components/ui/input'
import { Label } from '@admin/components/ui/label'
import { Textarea } from '@admin/components/ui/textarea'
import { API_BASE_URL } from '@admin/api/config'
import { AlertDialog } from '@admin/components/ui/alert-dialog'
import { toastError, toastInfo, toastSuccess } from '@admin/lib/toast'
import { ImagePlus, List, Loader2, Save, Trash2 } from 'lucide-react'

const emptyCircle = (): DirectionImpactCircle => ({
  titleUk: '',
  titleEn: '',
  excerptUk: '',
  excerptEn: '',
})

function normalizeCircles(raw: unknown): DirectionImpactCircle[] {
  if (!Array.isArray(raw)) return []
  return raw.map((x) => {
    const o = x as Record<string, unknown>
    return {
      titleUk: String(o.titleUk ?? ''),
      titleEn: String(o.titleEn ?? ''),
      excerptUk: String(o.excerptUk ?? ''),
      excerptEn: String(o.excerptEn ?? ''),
    }
  })
}

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
  const [impactCircles, setImpactCircles] = useState<DirectionImpactCircle[]>([])
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
        setImpactCircles(normalizeCircles(d.impactCircles))
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
          impactCircles,
        },
      })
      setDirection(updated)
      setImpactCircles(normalizeCircles(updated.impactCircles))
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
    <div className="mx-auto w-full max-w-5xl space-y-6 pb-28 px-1 sm:px-0">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-[hsl(var(--foreground))]">
            Редагування напрямку
          </h1>
          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
            ID: <span className="font-mono">{directionId}</span>
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          <Button
            type="button"
            variant={lang === 'uk' ? 'default' : 'secondary'}
            size="sm"
            className="min-w-11 px-2"
            onClick={() => setLang('uk')}
            aria-label="Українська"
            title="Українська"
          >
            UA
          </Button>
          <Button
            type="button"
            variant={lang === 'en' ? 'default' : 'secondary'}
            size="sm"
            className="min-w-11 px-2"
            onClick={() => setLang('en')}
            aria-label="English"
            title="English"
          >
            EN
          </Button>
          <Button
            type="button"
            disabled={saving}
            className="size-9 shrink-0 px-0"
            onClick={() => void save()}
            aria-label={saving ? 'Зберігання…' : 'Зберегти'}
            title={saving ? 'Зберігання…' : 'Зберегти'}
          >
            {saving ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <Save className="size-4" aria-hidden />
            )}
          </Button>
          <Button
            variant="secondary"
            className="size-9 shrink-0 px-0"
            onClick={() => setDeleteOpen(true)}
            aria-label="Видалити"
            title="Видалити"
          >
            <Trash2 className="size-4" aria-hidden />
          </Button>
          <Button
            variant="secondary"
            className="size-9 shrink-0 px-0"
            onClick={() => navigate('/directions')}
            aria-label="До списку напрямків"
            title="До списку"
          >
            <List className="size-4" aria-hidden />
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
            <Label htmlFor="direction-cover-file">Зображення</Label>
            {coverUrl ? (
              <div className="overflow-hidden rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card)/0.4)]">
                <img
                  src={`${API_BASE_URL.replace(/\/api$/, '')}${coverUrl}`}
                  alt=""
                  className="max-h-56 w-full object-cover"
                  loading="lazy"
                />
              </div>
            ) : (
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Зображення ще не завантажено.</p>
            )}
            <div className="flex flex-wrap items-center gap-3">
              <input
                id="direction-cover-file"
                ref={coverInputRef}
                type="file"
                accept="image/*"
                disabled={uploadingCover}
                className="hidden"
                onChange={(e) => void onUploadCover(e.target.files?.[0] ?? null)}
              />
              <Button
                type="button"
                variant="secondary"
                disabled={uploadingCover}
                onClick={() => coverInputRef.current?.click()}
                className="size-9 shrink-0 px-0"
                aria-label={
                  uploadingCover
                    ? 'Завантаження зображення…'
                    : coverUrl
                      ? 'Замінити зображення'
                      : 'Обрати зображення'
                }
                title={
                  uploadingCover
                    ? 'Завантаження…'
                    : coverUrl
                      ? 'Замінити зображення'
                      : 'Обрати зображення'
                }
              >
                {uploadingCover ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : (
                  <ImagePlus className="size-4" aria-hidden />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-[hsl(var(--card)/0.65)] backdrop-blur">
        <CardHeader>
          <CardTitle>Кола «Результати»</CardTitle>
          <CardDescription>
            Заголовок (наприклад число) і короткий підпис — як на сторінці проєкту в кругах. Відображається для проєкту,
            прив’язаного до цього напрямку.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="space-y-3">
            {impactCircles.length === 0 ? (
              <div className="text-sm text-[hsl(var(--muted-foreground))]">Блоків ще немає.</div>
            ) : null}
            {impactCircles.map((r, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card)/0.4)] p-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs font-medium text-[hsl(var(--muted-foreground))]">Коло {idx + 1}</div>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setImpactCircles((prev) => prev.filter((_, i) => i !== idx))}>
                    Прибрати
                  </Button>
                </div>
                <div className="mt-3 grid gap-2">
                  <Label>Заголовок (у колі)</Label>
                  <Input
                    value={lang === 'uk' ? r.titleUk : r.titleEn}
                    onChange={(e) =>
                      setImpactCircles((prev) =>
                        prev.map((x, i) =>
                          i === idx
                            ? { ...x, ...(lang === 'uk' ? { titleUk: e.target.value } : { titleEn: e.target.value }) }
                            : x,
                        ),
                      )
                    }
                  />
                  <Label>Підпис під заголовком</Label>
                  <Textarea
                    value={lang === 'uk' ? r.excerptUk : r.excerptEn}
                    onChange={(e) =>
                      setImpactCircles((prev) =>
                        prev.map((x, i) =>
                          i === idx
                            ? {
                                ...x,
                                ...(lang === 'uk' ? { excerptUk: e.target.value } : { excerptEn: e.target.value }),
                              }
                            : x,
                        ),
                      )
                    }
                    rows={2}
                  />
                </div>
              </div>
            ))}
          </div>
          <Button type="button" variant="secondary" size="sm" onClick={() => setImpactCircles((prev) => [...prev, emptyCircle()])}>
            Додати коло
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
