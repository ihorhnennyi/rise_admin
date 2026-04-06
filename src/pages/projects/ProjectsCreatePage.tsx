import { useMemo, useRef, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiFetch, ApiError } from '@admin/api/http'
import type { Direction } from '@admin/types/directions'
import type { Project } from '@admin/types/projects'
import { Button } from '@admin/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@admin/components/ui/card'
import { Input } from '@admin/components/ui/input'
import { Label } from '@admin/components/ui/label'
import { Textarea } from '@admin/components/ui/textarea'
import { RichTextEditor } from '@admin/components/RichTextEditor'
import { SelectMenu, type SelectMenuOption } from '@admin/components/ui/select-menu'
import { toastError, toastSuccess } from '@admin/lib/toast'

export function ProjectsCreatePage() {
  const navigate = useNavigate()
  const [lang, setLang] = useState<'uk' | 'en'>('uk')
  const [titleUk, setTitleUk] = useState('')
  const [titleEn, setTitleEn] = useState('')
  const [excerptUk, setExcerptUk] = useState('')
  const [excerptEn, setExcerptEn] = useState('')
  const [contentUk, setContentUk] = useState('')
  const [contentEn, setContentEn] = useState('')
  const [results, setResults] = useState<Array<{ titleUk: string; titleEn: string; excerptUk: string; excerptEn: string }>>([])
  const [directionId, setDirectionId] = useState('')
  const [implementationStatus, setImplementationStatus] = useState<'' | 'implemented' | 'current'>('')
  const [directions, setDirections] = useState<Direction[]>([])
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [galleryFiles, setGalleryFiles] = useState<File[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const coverInputRef = useRef<HTMLInputElement | null>(null)
  const galleryInputRef = useRef<HTMLInputElement | null>(null)

  const coverPreviewUrl = useMemo(
    () => (coverFile ? URL.createObjectURL(coverFile) : null),
    [coverFile],
  )

  useEffect(() => {
    return () => {
      if (coverPreviewUrl) URL.revokeObjectURL(coverPreviewUrl)
    }
  }, [coverPreviewUrl])

  useEffect(() => {
    let cancelled = false
    async function run() {
      try {
        const data = await apiFetch<Direction[]>('/directions')
        if (!cancelled) setDirections(data)
      } catch {
        if (!cancelled) setDirections([])
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [])

  const directionSelectOptions = useMemo<SelectMenuOption[]>(() => {
    const none = lang === 'uk' ? '— не обрано —' : '— not selected —'
    return [
      { value: '', label: none },
      ...directions.map((d) => ({
        value: d._id,
        label: (d.titleUk ?? d.title ?? '').toString() || d._id,
      })),
    ]
  }, [lang, directions])

  const statusSelectOptions = useMemo<SelectMenuOption[]>(() => {
    const none = lang === 'uk' ? '— не обрано —' : '— not selected —'
    return [
      { value: '', label: none },
      { value: 'implemented', label: lang === 'uk' ? 'Реалізований' : 'Implemented' },
      { value: 'current', label: lang === 'uk' ? 'Актуальний' : 'Current' },
    ]
  }, [lang])

  async function onCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const created = await apiFetch<Project>('/projects', {
        method: 'POST',
        json: {
          titleUk,
          titleEn,
          excerptUk,
          excerptEn,
          contentUk,
          contentEn,
          results,
          directionId: directionId.trim() || undefined,
          ...(implementationStatus ? { implementationStatus } : {}),
        },
      })

      if (coverFile) {
        const form = new FormData()
        form.append('image', coverFile)
        await apiFetch(`/projects/${created._id}/cover`, {
          method: 'POST',
          body: form,
        })
      }

      if (galleryFiles.length > 0) {
        const form = new FormData()
        galleryFiles.forEach((f) => form.append('images', f))
        await apiFetch(`/projects/${created._id}/images`, {
          method: 'POST',
          body: form,
        })
      }

      toastSuccess('Створено', 'Проєкт створено успішно.')
      navigate(`/projects/${created._id}`, { replace: true })
    } catch (e) {
      if (e instanceof ApiError) setError('Не вдалося створити.')
      else setError('Помилка. Спробуй ще раз.')
      toastError('Помилка', 'Не вдалося створити проєкт.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[hsl(var(--foreground))]">
          Створити проєкт
        </h1>
        <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
          Після створення можна оновити картинку. Напрямок — для картки на головній (опційно).
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
          <CardDescription>Заголовок, опис, контент, головна картинка.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4" onSubmit={onCreate}>
            <div className="grid gap-2">
              <Label>Заголовок</Label>
              <Input
                value={lang === 'uk' ? titleUk : titleEn}
                onChange={(e) => (lang === 'uk' ? setTitleUk(e.target.value) : setTitleEn(e.target.value))}
                required={lang === 'uk'}
              />
            </div>

            <div className="grid gap-2">
              <Label>Короткий опис</Label>
              <Textarea
                value={lang === 'uk' ? excerptUk : excerptEn}
                onChange={(e) => (lang === 'uk' ? setExcerptUk(e.target.value) : setExcerptEn(e.target.value))}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="project-create-direction">{lang === 'uk' ? 'Напрямок (опційно)' : 'Direction (optional)'}</Label>
              <SelectMenu
                id="project-create-direction"
                value={directionId}
                onValueChange={setDirectionId}
                options={directionSelectOptions}
                placeholder={lang === 'uk' ? '— не обрано —' : '— not selected —'}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="project-create-status">{lang === 'uk' ? 'Статус (опційно)' : 'Status (optional)'}</Label>
              <SelectMenu
                id="project-create-status"
                value={implementationStatus}
                onValueChange={(v) => setImplementationStatus(v as '' | 'implemented' | 'current')}
                options={statusSelectOptions}
                placeholder={lang === 'uk' ? '— не обрано —' : '— not selected —'}
              />
            </div>

            <div className="grid gap-2">
              <Label>Контент</Label>
              <RichTextEditor
                value={lang === 'uk' ? contentUk : contentEn}
                onChange={(html) => (lang === 'uk' ? setContentUk(html) : setContentEn(html))}
                placeholder="Текст…"
                minHeightClassName="min-h-[420px]"
              />
            </div>

            <div className="grid gap-2">
              <Label>Результати (блоки)</Label>
              <div className="space-y-3">
                {results.length === 0 ? (
                  <div className="text-sm text-[hsl(var(--muted-foreground))]">Блоків ще немає.</div>
                ) : null}
                {results.map((r, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card)/0.4)] p-4"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
                        {idx + 1}. result
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setResults((prev) => prev.filter((_, i) => i !== idx))}
                      >
                        Remove
                      </Button>
                    </div>
                    <div className="mt-3 grid gap-2">
                      <Label>Заголовок</Label>
                      <Input
                        value={lang === 'uk' ? r.titleUk : r.titleEn}
                        onChange={(e) =>
                          setResults((prev) =>
                            prev.map((x, i) =>
                              i === idx
                                ? { ...x, ...(lang === 'uk' ? { titleUk: e.target.value } : { titleEn: e.target.value }) }
                                : x,
                            ),
                          )
                        }
                      />
                      <Label>Короткий опис</Label>
                      <Textarea
                        value={lang === 'uk' ? r.excerptUk : r.excerptEn}
                        onChange={(e) =>
                          setResults((prev) =>
                            prev.map((x, i) =>
                              i === idx
                                ? {
                                    ...x,
                                    ...(lang === 'uk'
                                      ? { excerptUk: e.target.value }
                                      : { excerptEn: e.target.value }),
                                  }
                                : x,
                            ),
                          )
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() =>
                  setResults((prev) => [
                    ...prev,
                    { titleUk: '', titleEn: '', excerptUk: '', excerptEn: '' },
                  ])
                }
              >
                Додати результат
              </Button>
            </div>

            <div className="grid gap-2">
              <Label>Головна картинка</Label>
              <div className="flex items-center gap-3">
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={saving}
                  onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
                />
                <Button type="button" variant="secondary" size="sm" disabled={saving} onClick={() => coverInputRef.current?.click()}>
                  Вибрати файл
                </Button>
                <div className="text-xs text-[hsl(var(--muted-foreground))]">
                  {coverFile ? coverFile.name : 'Файл не вибран'}
                </div>
              </div>
              {coverPreviewUrl ? (
                <div className="overflow-hidden rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card)/0.4)]">
                  <img src={coverPreviewUrl} alt="" className="aspect-[21/7] w-full object-cover" />
                </div>
              ) : null}
            </div>

            <div className="grid gap-2">
              <Label>Картинки (галерея)</Label>
              <div className="flex items-center gap-3">
                <input
                  ref={galleryInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  disabled={saving}
                  onChange={(e) => setGalleryFiles(Array.from(e.target.files ?? []))}
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={saving}
                  onClick={() => galleryInputRef.current?.click()}
                >
                  Вибрати файли
                </Button>
                <div className="text-xs text-[hsl(var(--muted-foreground))]">
                  {galleryFiles.length > 0 ? `Вибрано: ${galleryFiles.length}` : 'Файли не вибрані'}
                </div>
              </div>
            </div>

            {error ? <p className="text-sm text-red-400">{error}</p> : null}

            <div className="flex gap-2">
              <Button type="submit" disabled={saving}>
                {saving ? 'Створюю…' : 'Створити'}
              </Button>
              <Button type="button" variant="secondary" onClick={() => navigate('/projects')}>
                Назад
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

