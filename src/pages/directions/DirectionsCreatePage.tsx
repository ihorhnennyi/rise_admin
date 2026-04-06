import { useMemo, useRef, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiFetch, ApiError } from '@admin/api/http'
import type { Direction } from '@admin/types/directions'
import { Button } from '@admin/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@admin/components/ui/card'
import { Input } from '@admin/components/ui/input'
import { Label } from '@admin/components/ui/label'
import { Textarea } from '@admin/components/ui/textarea'
import { toastError, toastSuccess } from '@admin/lib/toast'
import { ImagePlus } from 'lucide-react'

export function DirectionsCreatePage() {
  const navigate = useNavigate()
  const [lang, setLang] = useState<'uk' | 'en'>('uk')
  const [titleUk, setTitleUk] = useState('')
  const [titleEn, setTitleEn] = useState('')
  const [excerptUk, setExcerptUk] = useState('')
  const [excerptEn, setExcerptEn] = useState('')
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
    setSaving(true)
    setError(null)
    try {
      const created = await apiFetch<Direction>('/directions', {
        method: 'POST',
        json: {
          titleUk,
          titleEn,
          excerptUk,
          excerptEn,
        },
      })

      if (coverFile) {
        const form = new FormData()
        form.append('image', coverFile)
        await apiFetch(`/directions/${created._id}/cover`, {
          method: 'POST',
          body: form,
        })
      }

      toastSuccess('Створено', 'Напрямок створено.')
      navigate(`/directions/${created._id}`, { replace: true })
    } catch (e) {
      if (e instanceof ApiError) setError('Не вдалося створити.')
      else setError('Помилка. Спробуй ще раз.')
      toastError('Помилка', 'Не вдалося створити напрямок.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[hsl(var(--foreground))]">
          Створити напрямок
        </h1>
        <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
          Картка на головній. Зв’язок із проєктом налаштовується в картці проєкту.
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
          <CardDescription>Заголовок і короткий опис для картки.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4" onSubmit={onCreate}>
            <div className="grid gap-2">
              <Label>Заголовок</Label>
              <Input
                required
                value={lang === 'uk' ? titleUk : titleEn}
                onChange={(e) => (lang === 'uk' ? setTitleUk(e.target.value) : setTitleEn(e.target.value))}
              />
            </div>
            <div className="grid gap-2">
              <Label>Опис (картка)</Label>
              <Textarea
                value={lang === 'uk' ? excerptUk : excerptEn}
                onChange={(e) => (lang === 'uk' ? setExcerptUk(e.target.value) : setExcerptEn(e.target.value))}
                rows={4}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="direction-new-cover-file">Зображення картки</Label>
              <div className="flex flex-wrap items-center gap-3">
                <input
                  id="direction-new-cover-file"
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
                  <span className="text-xs text-[hsl(var(--muted-foreground))] truncate max-w-[min(100%,14rem)]" title={coverFile.name}>
                    {coverFile.name}
                  </span>
                ) : null}
              </div>
              {coverPreviewUrl ? (
                <img src={coverPreviewUrl} alt="" className="max-h-48 rounded-xl border border-[hsl(var(--border))] object-cover" />
              ) : null}
            </div>
            {error ? <div className="text-sm text-red-400">{error}</div> : null}
            <div className="flex gap-2">
              <Button type="submit" disabled={saving}>
                {saving ? 'Створюю…' : 'Створити'}
              </Button>
              <Button type="button" variant="secondary" onClick={() => navigate('/directions')}>
                Скасувати
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
