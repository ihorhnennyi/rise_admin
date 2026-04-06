import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { apiFetch, ApiError } from '@admin/api/http'
import type { Direction } from '@admin/types/directions'
import type { Project } from '@admin/types/projects'
import { Button } from '@admin/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@admin/components/ui/card'
import { Input } from '@admin/components/ui/input'
import { Label } from '@admin/components/ui/label'
import { Textarea } from '@admin/components/ui/textarea'
import { API_BASE_URL } from '@admin/api/config'
import { AlertDialog } from '@admin/components/ui/alert-dialog'
import { AdminPersistFooter } from '@admin/components/AdminPersistFooter'
import { usePersistedJsonAutosave } from '@admin/hooks/usePersistedJsonAutosave'
import { SelectMenu, type SelectMenuOption } from '@admin/components/ui/select-menu'
import { toastError, toastInfo, toastSuccess } from '@admin/lib/toast'
import { Trash2 } from 'lucide-react'

export function ProjectsEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const projectId = id ?? ''

  const [project, setProject] = useState<Project | null>(null)
  const [lang, setLang] = useState<'uk' | 'en'>('uk')
  const [titleUk, setTitleUk] = useState('')
  const [titleEn, setTitleEn] = useState('')
  const [excerptUk, setExcerptUk] = useState('')
  const [excerptEn, setExcerptEn] = useState('')
  const [results, setResults] = useState<Array<{ titleUk: string; titleEn: string; excerptUk: string; excerptEn: string }>>([])
  const [directionId, setDirectionId] = useState('')
  const [implementationStatus, setImplementationStatus] = useState<'' | 'implemented' | 'current'>('')
  const [directions, setDirections] = useState<Direction[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)
  const [uploadingImages, setUploadingImages] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const coverInputRef = useRef<HTMLInputElement | null>(null)
  const galleryInputRef = useRef<HTMLInputElement | null>(null)
  const initialRef = useRef<string>('')

  const coverUrl = useMemo(() => project?.coverImageUrl ?? null, [project?.coverImageUrl])

  useEffect(() => {
    let cancelled = false
    async function run() {
      try {
        const data = await apiFetch<Project>(`/projects/${projectId}`)
        if (cancelled) return
        setProject(data)
        setTitleUk((data.titleUk ?? data.title ?? '').toString())
        setTitleEn((data.titleEn ?? '').toString())
        setExcerptUk((data.excerptUk ?? data.excerpt ?? '').toString())
        setExcerptEn((data.excerptEn ?? '').toString())
        setResults(Array.isArray((data as any).results) ? ((data as any).results as any) : [])
        setDirectionId((data.directionId ?? '').toString())
        const st = (data as Project).implementationStatus
        setImplementationStatus(st === 'implemented' || st === 'current' ? st : '')
        initialRef.current = JSON.stringify({
          titleUk: (data.titleUk ?? data.title ?? '').toString(),
          titleEn: (data.titleEn ?? '').toString(),
          excerptUk: (data.excerptUk ?? data.excerpt ?? '').toString(),
          excerptEn: (data.excerptEn ?? '').toString(),
          results: Array.isArray((data as any).results) ? ((data as any).results as any) : [],
          directionId: (data.directionId ?? '').toString(),
          implementationStatus: st === 'implemented' || st === 'current' ? st : '',
        })
      } catch (e) {
        if (cancelled) return
        setProject(null)
        if (e instanceof ApiError && e.status === 401) return
        setError('Не вдалося завантажити.')
        toastError('Помилка', 'Не вдалося завантажити проєкт.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    if (projectId) void run()
    return () => {
      cancelled = true
    }
  }, [projectId])

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

  const patchJson = useMemo(
    () =>
      JSON.stringify({
        titleUk,
        titleEn,
        excerptUk,
        excerptEn,
        results,
        directionId,
        implementationStatus,
      }),
    [titleUk, titleEn, excerptUk, excerptEn, results, directionId, implementationStatus],
  )

  const dirty = patchJson !== initialRef.current

  async function save(opts?: { silent?: boolean }): Promise<boolean> {
    const silent = opts?.silent === true
    if (silent && patchJson === initialRef.current) return true
    if (!silent) setSaving(true)
    if (!silent) setError(null)
    try {
      const updated = await apiFetch<Project>(`/projects/${projectId}`, {
        method: 'PATCH',
        json: {
          titleUk,
          titleEn,
          excerptUk,
          excerptEn,
          results,
          directionId: directionId.trim() || null,
          implementationStatus: implementationStatus || '',
        },
      })
      setProject(updated)
      setTitleUk((updated.titleUk ?? updated.title ?? '').toString())
      setTitleEn((updated.titleEn ?? '').toString())
      setExcerptUk((updated.excerptUk ?? updated.excerpt ?? '').toString())
      setExcerptEn((updated.excerptEn ?? '').toString())
      setResults(Array.isArray((updated as any).results) ? ((updated as any).results as any) : [])
      setDirectionId((updated.directionId ?? '').toString())
      const ust = (updated as Project).implementationStatus
      setImplementationStatus(ust === 'implemented' || ust === 'current' ? ust : '')
      initialRef.current = JSON.stringify({
        titleUk: (updated.titleUk ?? updated.title ?? '').toString(),
        titleEn: (updated.titleEn ?? '').toString(),
        excerptUk: (updated.excerptUk ?? updated.excerpt ?? '').toString(),
        excerptEn: (updated.excerptEn ?? '').toString(),
        results: Array.isArray((updated as any).results) ? ((updated as any).results as any) : [],
        directionId: (updated.directionId ?? '').toString(),
        implementationStatus: ust === 'implemented' || ust === 'current' ? ust : '',
      })
      if (!silent) toastSuccess('Збережено', 'Зміни збережено.')
      return true
    } catch {
      if (!silent) {
        setError('Не вдалося зберегти.')
        toastError('Помилка', 'Не вдалося зберегти.')
      }
      return false
    } finally {
      if (!silent) setSaving(false)
    }
  }

  usePersistedJsonAutosave({
    loading,
    isDirty: dirty,
    patchJson,
    saveSilent: () => save({ silent: true }).then(() => undefined),
  })

  async function onUploadCover(file: File | null) {
    if (!file) return
    setUploadingCover(true)
    setError(null)
    try {
      toastInfo('Завантаження…', 'Головна картинка')
      const form = new FormData()
      form.append('image', file)
      const updated = await apiFetch<Project>(`/projects/${projectId}/cover`, {
        method: 'POST',
        body: form,
      })
      setProject(updated)
      toastSuccess('Завантажено', 'Головна картинка оновлена.')
    } catch {
      setError('Не вдалося завантажити картинку.')
      toastError('Помилка', 'Не вдалося завантажити картинку.')
    } finally {
      setUploadingCover(false)
    }
  }

  async function onUploadImages(files: FileList | null) {
    if (!files || files.length === 0) return
    setUploadingImages(true)
    setError(null)
    try {
      toastInfo('Завантаження…', 'Картинки')
      const form = new FormData()
      Array.from(files).forEach((f) => form.append('images', f))
      const updated = await apiFetch<Project>(`/projects/${projectId}/images`, {
        method: 'POST',
        body: form,
      })
      setProject(updated)
      toastSuccess('Завантажено', 'Картинки додано.')
    } catch {
      setError('Не вдалося завантажити картинки.')
      toastError('Помилка', 'Не вдалося завантажити картинки.')
    } finally {
      setUploadingImages(false)
      if (galleryInputRef.current) galleryInputRef.current.value = ''
    }
  }

  async function onDeleteImage(url: string) {
    try {
      const updated = await apiFetch<Project>(`/projects/${projectId}/images`, {
        method: 'DELETE',
        json: { url },
      })
      setProject(updated)
      toastSuccess('Видалено', 'Картинку видалено.')
    } catch {
      toastError('Помилка', 'Не вдалося видалити картинку.')
    }
  }

  if (loading) return <div className="text-sm text-[hsl(var(--muted-foreground))]">Loading…</div>

  if (!project) {
    return (
      <div className="space-y-3">
        <div className="text-sm text-red-400">Не знайдено.</div>
        <Button asChild variant="secondary" size="sm">
          <Link to="/projects">Назад</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-28">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[hsl(var(--foreground))]">
            Редагування проєкту
          </h1>
          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
            ID: <span className="font-mono">{projectId}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant={lang === 'uk' ? 'default' : 'secondary'} size="sm" onClick={() => setLang('uk')}>
            UA
          </Button>
          <Button type="button" variant={lang === 'en' ? 'default' : 'secondary'} size="sm" onClick={() => setLang('en')}>
            EN
          </Button>
          {dirty ? (
            <Button type="button" disabled={saving} onClick={() => void save()}>
              {saving ? 'Зберігаю…' : 'Зберегти'}
            </Button>
          ) : null}
          <Button variant="secondary" onClick={() => setDeleteOpen(true)}>
            Видалити
          </Button>
          <Button variant="secondary" onClick={() => navigate('/projects')}>
            До списку
          </Button>
        </div>
      </div>

      <AlertDialog
        open={deleteOpen}
        title="Видалити проєкт?"
        description="Також буде видалена папка з картинкою на сервері."
        cancelText="Скасувати"
        confirmText={deleting ? 'Видаляю…' : 'Видалити'}
        destructive
        confirmDisabled={deleting}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={async () => {
          setDeleting(true)
          try {
            await apiFetch(`/projects/${projectId}`, { method: 'DELETE' })
            toastSuccess('Видалено', 'Проєкт видалено.')
            navigate('/projects', { replace: true })
          } catch {
            setError('Не вдалося видалити.')
            toastError('Помилка', 'Не вдалося видалити.')
          } finally {
            setDeleting(false)
            setDeleteOpen(false)
          }
        }}
      />

      <Card className="bg-[hsl(var(--card)/0.65)] backdrop-blur">
        <CardHeader>
          <CardTitle>Основне</CardTitle>
          <CardDescription>Заголовок, опис, напрямок, картинка, результати, галерея.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-4"
            onSubmit={(e) => {
              e.preventDefault()
              void save()
            }}
          >
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
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="project-edit-direction">{lang === 'uk' ? 'Напрямок (опційно)' : 'Direction (optional)'}</Label>
              <SelectMenu
                id="project-edit-direction"
                value={directionId}
                onValueChange={setDirectionId}
                options={directionSelectOptions}
                placeholder={lang === 'uk' ? '— не обрано —' : '— not selected —'}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="project-edit-status">{lang === 'uk' ? 'Статус (опційно)' : 'Status (optional)'}</Label>
              <SelectMenu
                id="project-edit-status"
                value={implementationStatus}
                onValueChange={(v) => setImplementationStatus(v as '' | 'implemented' | 'current')}
                options={statusSelectOptions}
                placeholder={lang === 'uk' ? '— не обрано —' : '— not selected —'}
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
                  disabled={uploadingCover}
                  onChange={(e) => void onUploadCover(e.target.files?.[0] ?? null)}
                />
                <Button type="button" variant="secondary" size="sm" disabled={uploadingCover} onClick={() => coverInputRef.current?.click()}>
                  Вибрати файл
                </Button>
                <div className="text-xs text-[hsl(var(--muted-foreground))]">
                  {uploadingCover ? 'Uploading…' : ''}
                </div>
              </div>
              {coverUrl ? (
                <div className="overflow-hidden rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card)/0.4)]">
                  <img
                    src={`${API_BASE_URL.replace(/\/api$/, '')}${coverUrl}`}
                    alt=""
                    className="aspect-[21/7] w-full object-cover"
                    loading="lazy"
                  />
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
                  disabled={uploadingImages}
                  onChange={(e) => void onUploadImages(e.target.files)}
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={uploadingImages}
                  onClick={() => galleryInputRef.current?.click()}
                >
                  Вибрати файли
                </Button>
                <div className="text-xs text-[hsl(var(--muted-foreground))]">
                  {uploadingImages ? 'Uploading…' : ''}
                </div>
              </div>

              {((project as any).imageUrls?.length ?? 0) === 0 ? (
                <div className="text-sm text-[hsl(var(--muted-foreground))]">Картинок ще немає.</div>
              ) : (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
                  {((project as any).imageUrls as string[]).map((url) => {
                    const origin = API_BASE_URL.replace(/\/api$/, '')
                    const src = url.startsWith('http') ? url : `${origin}${url}`
                    return (
                      <div
                        key={url}
                        className="group relative overflow-hidden rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card)/0.4)]"
                        title={url}
                      >
                        <a href={src} target="_blank" rel="noreferrer">
                          <img
                            src={src}
                            alt=""
                            className="aspect-square w-full object-cover opacity-95 transition group-hover:opacity-100"
                            loading="lazy"
                          />
                        </a>
                        <button
                          type="button"
                          onClick={() => void onDeleteImage(url)}
                          className="absolute right-1 top-1 hidden rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background)/0.85)] p-1 text-[hsl(var(--foreground))] shadow-sm backdrop-blur group-hover:block"
                          aria-label="Delete image"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {error ? <p className="text-sm text-red-400">{error}</p> : null}
          </form>
        </CardContent>
      </Card>

      <AdminPersistFooter saving={saving} onSave={() => void save()} disabled={saving} />
    </div>
  )
}

