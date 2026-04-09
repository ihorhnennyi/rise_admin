import { useMemo, useRef, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiFetch, ApiError } from '@admin/api/http'
import type { MediaMention } from '@admin/types/media-mentions'
import { Button } from '@admin/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@admin/components/ui/card'
import { Input } from '@admin/components/ui/input'
import { Label } from '@admin/components/ui/label'
import { Textarea } from '@admin/components/ui/textarea'
import { toastError, toastSuccess } from '@admin/lib/toast'
import { ImagePlus } from 'lucide-react'

function todayYmd(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function MediaMentionCreatePage() {
  const navigate = useNavigate()
  const [lang, setLang] = useState<'uk' | 'en'>('uk')
  const [titleUk, setTitleUk] = useState('')
  const [titleEn, setTitleEn] = useState('')
  const [excerptUk, setExcerptUk] = useState('')
  const [excerptEn, setExcerptEn] = useState('')
  const [publishedAtYmd, setPublishedAtYmd] = useState(todayYmd)
  const [href, setHref] = useState('')
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const coverInputRef = useRef<HTMLInputElement | null>(null)

  const coverPreviewUrl = useMemo(
    () => (coverFile ? URL.createObjectURL(coverFile) : null),
    [coverFile],
  )

  useEffect(() => {
    return () => {
      if (coverPreviewUrl) URL.revokeObjectURL(coverPreviewUrl)
    }
  }, [coverPreviewUrl])

  async function onCreate(e: React.FormEvent) {
    e.preventDefault()
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
    setError(null)
    try {
      const created = await apiFetch<MediaMention>('/media-mentions', {
        method: 'POST',
        json: {
          titleUk: titleUk.trim(),
          titleEn: titleEn.trim(),
          excerptUk: excerptUk.trim(),
          excerptEn: excerptEn.trim(),
          publishedAt: publishedAtYmd ? `${publishedAtYmd}T12:00:00.000Z` : undefined,
          href: hrefTrim,
        },
      })

      if (coverFile) {
        const form = new FormData()
        form.append('image', coverFile)
        await apiFetch(`/media-mentions/${created._id}/image`, {
          method: 'POST',
          body: form,
        })
      }

      toastSuccess('Створено', 'Запис додано.')
      navigate(`/media-mentions/${created._id}`, { replace: true })
    } catch (e) {
      if (e instanceof ApiError) setError('Не вдалося створити.')
      else setError('Помилка. Спробуй ще раз.')
      toastError('Помилка', 'Не вдалося створити запис.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-1 sm:px-0">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[hsl(var(--foreground))]">
          Додати згадку у ЗМІ
        </h1>
        <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
          Заголовок, опис, дата публікації та посилання на зовнішній матеріал.
        </p>
      </div>

      <Card className="bg-[hsl(var(--card)/0.65)] backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-3">
            <span>Дані</span>
            <div className="flex gap-2">
              <Button type="button" variant={lang === 'uk' ? 'default' : 'secondary'} size="sm" onClick={() => setLang('uk')}>
                UA
              </Button>
              <Button type="button" variant={lang === 'en' ? 'default' : 'secondary'} size="sm" onClick={() => setLang('en')}>
                EN
              </Button>
            </div>
          </CardTitle>
          <CardDescription>Тексти для картки на сайті.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4" onSubmit={onCreate}>
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
            <div className="grid gap-2 sm:grid-cols-2 sm:gap-4">
              <div className="grid gap-2">
                <Label htmlFor="media-mention-date">Дата (для бейджа)</Label>
                <Input
                  id="media-mention-date"
                  type="date"
                  value={publishedAtYmd}
                  onChange={(e) => setPublishedAtYmd(e.target.value)}
                />
              </div>
              <div className="grid gap-2 sm:col-span-1">
                <Label htmlFor="media-mention-href">Посилання на матеріал</Label>
                <Input
                  id="media-mention-href"
                  type="url"
                  placeholder="https://…"
                  value={href}
                  onChange={(e) => setHref(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="media-mention-cover-file">Зображення картки</Label>
              <div className="flex flex-wrap items-center gap-3">
                <input
                  id="media-mention-cover-file"
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => coverInputRef.current?.click()}
                  className="gap-2"
                >
                  <ImagePlus className="size-4 shrink-0" aria-hidden />
                  {coverFile ? 'Інше зображення' : 'Обрати зображення'}
                </Button>
                {coverFile ? (
                  <span
                    className="max-w-[min(100%,14rem)] truncate text-xs text-[hsl(var(--muted-foreground))]"
                    title={coverFile.name}
                  >
                    {coverFile.name}
                  </span>
                ) : null}
              </div>
              {coverPreviewUrl ? (
                <img
                  src={coverPreviewUrl}
                  alt=""
                  className="max-h-48 rounded-xl border border-[hsl(var(--border))] object-cover"
                />
              ) : null}
            </div>

            {error ? <p className="text-sm text-red-400">{error}</p> : null}

            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={saving}>
                {saving ? 'Збереження…' : 'Створити'}
              </Button>
              <Button type="button" variant="secondary" onClick={() => navigate('/media-mentions')}>
                Скасувати
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
