import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { apiFetch, ApiError } from '@admin/api/http'
import type { MediaMention } from '@admin/types/media-mentions'
import { Button } from '@admin/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@admin/components/ui/card'
import { Input } from '@admin/components/ui/input'
import { Label } from '@admin/components/ui/label'
import { Textarea } from '@admin/components/ui/textarea'
import { API_BASE_URL } from '@admin/api/config'
import { AlertDialog } from '@admin/components/ui/alert-dialog'
import { toastError, toastInfo, toastSuccess } from '@admin/lib/toast'
import { ImagePlus, List, Loader2, Save, Trash2 } from 'lucide-react'
import { isoToYear, yearToPublishedIsoUtc } from '@admin/lib/media-mention-year'
import { MediaYearPicker } from '@admin/components/media-year-picker'

export function MediaMentionEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const rowId = id ?? ''

  const [row, setRow] = useState<MediaMention | null>(null)
  const [lang, setLang] = useState<'uk' | 'en'>('uk')
  const [titleUk, setTitleUk] = useState('')
  const [titleEn, setTitleEn] = useState('')
  const [excerptUk, setExcerptUk] = useState('')
  const [excerptEn, setExcerptEn] = useState('')
  const [publishedYear, setPublishedYear] = useState(() => new Date().getFullYear())
  const [href, setHref] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const coverInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    let cancelled = false
    async function run() {
      try {
        const d = await apiFetch<MediaMention>(`/media-mentions/${rowId}`)
        if (cancelled) return
        setRow(d)
        setTitleUk((d.titleUk ?? '').toString())
        setTitleEn((d.titleEn ?? '').toString())
        setExcerptUk((d.excerptUk ?? '').toString())
        setExcerptEn((d.excerptEn ?? '').toString())
        setPublishedYear(isoToYear(d.publishedAt))
        setHref((d.href ?? '').toString())
      } catch (e) {
        if (cancelled) return
        setRow(null)
        if (e instanceof ApiError && e.status === 401) return
        toastError('Помилка', 'Не вдалося завантажити запис.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    if (rowId) void run()
    return () => {
      cancelled = true
    }
  }, [rowId])

  async function save() {
    if (!titleUk.trim()) {
      toastError('Помилка', 'Вкажіть заголовок українською (UA).')
      return
    }
    const hrefTrim = href.trim()
    if (!hrefTrim) {
      toastError('Помилка', 'Вкажіть посилання на матеріал.')
      return
    }
    setSaving(true)
    try {
      const updated = await apiFetch<MediaMention>(`/media-mentions/${rowId}`, {
        method: 'PATCH',
        json: {
          titleUk: titleUk.trim(),
          titleEn: titleEn.trim(),
          excerptUk: excerptUk.trim(),
          excerptEn: excerptEn.trim(),
          publishedAt: yearToPublishedIsoUtc(publishedYear),
          href: hrefTrim,
        },
      })
      setRow(updated)
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
      toastInfo('Завантаження…', 'Зображення картки')
      const form = new FormData()
      form.append('image', file)
      const updated = await apiFetch<MediaMention>(`/media-mentions/${rowId}/image`, {
        method: 'POST',
        body: form,
      })
      setRow(updated)
      toastSuccess('Завантажено', 'Зображення оновлено.')
    } catch {
      toastError('Помилка', 'Не вдалося завантажити зображення.')
    } finally {
      setUploadingCover(false)
      if (coverInputRef.current) coverInputRef.current.value = ''
    }
  }

  if (loading) return <div className="text-sm text-[hsl(var(--muted-foreground))]">Loading…</div>

  if (!row) {
    return (
      <div className="space-y-3">
        <div className="text-sm text-red-400">Не знайдено.</div>
        <Button asChild variant="secondary" size="sm">
          <Link to="/media-mentions">Назад</Link>
        </Button>
      </div>
    )
  }

  const coverUrl = row.imageUrl ?? null

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 pb-28 px-1 sm:px-0">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-[hsl(var(--foreground))]">
            Редагування: Про нас у ЗМІ
          </h1>
          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
            ID: <span className="font-mono">{rowId}</span>
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
            onClick={() => navigate('/media-mentions')}
            aria-label="До списку"
            title="До списку"
          >
            <List className="size-4" aria-hidden />
          </Button>
        </div>
      </div>

      <AlertDialog
        open={deleteOpen}
        title="Видалити запис?"
        description="Картка зникне з розділу «Про нас у ЗМІ» на сайті."
        cancelText="Скасувати"
        confirmText={deleting ? 'Видаляю…' : 'Видалити'}
        destructive
        confirmDisabled={deleting}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={async () => {
          setDeleting(true)
          try {
            await apiFetch(`/media-mentions/${rowId}`, { method: 'DELETE' })
            toastSuccess('Видалено', 'Запис видалено.')
            navigate('/media-mentions', { replace: true })
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
          <CardTitle>Картка</CardTitle>
          <CardDescription>Тексти, дата, посилання та зображення.</CardDescription>
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
            <Label>Короткий опис</Label>
            <Textarea
              value={lang === 'uk' ? excerptUk : excerptEn}
              onChange={(e) => (lang === 'uk' ? setExcerptUk(e.target.value) : setExcerptEn(e.target.value))}
              rows={4}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="media-edit-year">Рік (для бейджа)</Label>
              <MediaYearPicker
                id="media-edit-year"
                value={publishedYear}
                onChange={setPublishedYear}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="media-edit-href">Посилання на матеріал</Label>
              <Input
                id="media-edit-href"
                type="url"
                placeholder="https://…"
                value={href}
                onChange={(e) => setHref(e.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="media-edit-cover-file">Зображення</Label>
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
                id="media-edit-cover-file"
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
                aria-label={uploadingCover ? 'Завантаження…' : coverUrl ? 'Замінити зображення' : 'Обрати зображення'}
                title={uploadingCover ? 'Завантаження…' : coverUrl ? 'Замінити зображення' : 'Обрати зображення'}
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
    </div>
  )
}
