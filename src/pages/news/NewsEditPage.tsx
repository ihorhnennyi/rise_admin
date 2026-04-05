import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { apiFetch, ApiError } from '@admin/api/http'
import type { News, NewsBlock } from '@admin/types/news'
import { Button } from '@admin/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@admin/components/ui/card'
import { Input } from '@admin/components/ui/input'
import { Label } from '@admin/components/ui/label'
import { Textarea } from '@admin/components/ui/textarea'
import { API_BASE_URL } from '@admin/api/config'
import { AlertDialog } from '@admin/components/ui/alert-dialog'
import { ArrowDown, ArrowUp, Image as ImageIcon, List, Quote, Trash2, Type } from 'lucide-react'
import { RichTextEditor } from '@admin/components/RichTextEditor'
import { AdminPersistFooter } from '@admin/components/AdminPersistFooter'
import { usePersistedJsonAutosave } from '@admin/hooks/usePersistedJsonAutosave'
import { toastError, toastInfo, toastSuccess } from '@admin/lib/toast'

export function NewsEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const newsId = id ?? ''

  const [news, setNews] = useState<News | null>(null)
  const [lang, setLang] = useState<'uk' | 'en'>('uk')
  const [titleUk, setTitleUk] = useState('')
  const [titleEn, setTitleEn] = useState('')
  const [excerptUk, setExcerptUk] = useState('')
  const [excerptEn, setExcerptEn] = useState('')
  const [blocks, setBlocks] = useState<NewsBlock[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const coverInputRef = useRef<HTMLInputElement | null>(null)
  const blockInputRefs = useRef<Record<number, HTMLInputElement | null>>({})
  const initialRef = useRef<string>('')

  function sanitizeBlocks(input: unknown): NewsBlock[] {
    if (!Array.isArray(input)) return []
    const out: NewsBlock[] = []
    for (const raw of input) {
      if (!raw || typeof raw !== 'object' || Array.isArray(raw)) continue
      const b = raw as any
      if (b.type === 'text')
        out.push({
          type: 'text',
          textUk: String(b.textUk ?? b.text ?? ''),
          textEn: String(b.textEn ?? ''),
        })
      else if (b.type === 'quote')
        out.push({
          type: 'quote',
          quoteUk: String(b.quoteUk ?? b.quote ?? ''),
          quoteEn: String(b.quoteEn ?? ''),
          authorUk: b.authorUk != null ? String(b.authorUk) : b.author != null ? String(b.author) : '',
          authorEn: b.authorEn != null ? String(b.authorEn) : '',
        })
      else if (b.type === 'image')
        out.push({
          type: 'image',
          url: b.url != null ? String(b.url) : '',
          captionUk: b.captionUk != null ? String(b.captionUk) : b.caption != null ? String(b.caption) : '',
          captionEn: b.captionEn != null ? String(b.captionEn) : '',
        })
      else if (b.type === 'list')
        out.push({
          type: 'list',
          ordered: Boolean(b.ordered),
          itemsUk: Array.isArray(b.itemsUk ?? b.items)
            ? (b.itemsUk ?? b.items)
                .map((x: unknown) => String(x ?? '').trim())
                .filter((x: string) => x.length > 0)
            : [],
          itemsEn: Array.isArray(b.itemsEn)
            ? b.itemsEn.map((x: unknown) => String(x ?? '').trim()).filter((x: string) => x.length > 0)
            : [],
        })
    }
    return out
  }

  const coverUrl = useMemo(() => news?.coverImageUrl ?? null, [news?.coverImageUrl])

  useEffect(() => {
    let cancelled = false
    async function run() {
      try {
        const data = await apiFetch<News>(`/news/${newsId}`)
        if (cancelled) return
        setNews(data)
        setTitleUk((data.titleUk ?? data.title ?? '').toString())
        setTitleEn((data.titleEn ?? '').toString())
        setExcerptUk((data.excerptUk ?? data.excerpt ?? '').toString())
        setExcerptEn((data.excerptEn ?? '').toString())
        setBlocks(sanitizeBlocks(data.blocks))
        initialRef.current = JSON.stringify({
          titleUk: (data.titleUk ?? data.title ?? '').toString(),
          titleEn: (data.titleEn ?? '').toString(),
          excerptUk: (data.excerptUk ?? data.excerpt ?? '').toString(),
          excerptEn: (data.excerptEn ?? '').toString(),
          blocks: sanitizeBlocks(data.blocks),
        })
      } catch (e) {
        if (cancelled) return
        setNews(null)
        if (e instanceof ApiError && e.status === 401) return
        setError('Не вдалося завантажити новину.')
        toastError('Помилка', 'Не вдалося завантажити новину.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    if (newsId) void run()
    return () => {
      cancelled = true
    }
  }, [newsId])

  const patchJson = useMemo(
    () => JSON.stringify({ titleUk, titleEn, excerptUk, excerptEn, blocks }),
    [titleUk, titleEn, excerptUk, excerptEn, blocks],
  )

  const dirty = patchJson !== initialRef.current

  async function save(opts?: { silent?: boolean }): Promise<boolean> {
    const silent = opts?.silent === true
    if (silent && patchJson === initialRef.current) return true
    if (!silent) setSaving(true)
    if (!silent) setError(null)
    try {
      const safeBlocks = sanitizeBlocks(blocks)
      const updated = await apiFetch<News>(`/news/${newsId}`, {
        method: 'PATCH',
        json: { titleUk, titleEn, excerptUk, excerptEn, blocks: safeBlocks },
      })
      setNews(updated)
      setTitleUk((updated.titleUk ?? updated.title ?? '').toString())
      setTitleEn((updated.titleEn ?? '').toString())
      setExcerptUk((updated.excerptUk ?? updated.excerpt ?? '').toString())
      setExcerptEn((updated.excerptEn ?? '').toString())
      setBlocks(sanitizeBlocks(updated.blocks))
      initialRef.current = JSON.stringify({
        titleUk: (updated.titleUk ?? updated.title ?? '').toString(),
        titleEn: (updated.titleEn ?? '').toString(),
        excerptUk: (updated.excerptUk ?? updated.excerpt ?? '').toString(),
        excerptEn: (updated.excerptEn ?? '').toString(),
        blocks: sanitizeBlocks(updated.blocks),
      })
      if (!silent) toastSuccess('Збережено', 'Зміни збережено.')
      return true
    } catch (e) {
      if (!silent) {
        if (e instanceof ApiError) setError('Не вдалося зберегти зміни.')
        else setError('Помилка. Спробуй ще раз.')
        toastError('Помилка', 'Не вдалося зберегти зміни.')
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
      const updated = await apiFetch<News>(`/news/${newsId}/cover`, {
        method: 'POST',
        body: form,
      })
      setNews(updated)
      toastSuccess('Завантажено', 'Головна картинка оновлена.')
    } catch {
      setError('Не вдалося завантажити головну картинку.')
      toastError('Помилка', 'Не вдалося завантажити головну картинку.')
    } finally {
      setUploadingCover(false)
    }
  }

  function addBlock(type: NewsBlock['type']) {
    if (type === 'text') setBlocks((b) => [...b, { type: 'text', textUk: '', textEn: '' }])
    if (type === 'quote')
      setBlocks((b) => [
        ...b,
        { type: 'quote', quoteUk: '', quoteEn: '', authorUk: '', authorEn: '' },
      ])
    if (type === 'image') setBlocks((b) => [...b, { type: 'image', url: '', captionUk: '', captionEn: '' }])
    if (type === 'list')
      setBlocks((b) => [...b, { type: 'list', ordered: false, itemsUk: [''], itemsEn: [''] }])
  }

  function moveBlock(idx: number, dir: -1 | 1) {
    setBlocks((prev) => {
      const next = [...prev]
      const j = idx + dir
      if (j < 0 || j >= next.length) return prev
      const tmp = next[idx]
      next[idx] = next[j]
      next[j] = tmp
      return next
    })
  }

  function removeBlock(idx: number) {
    setBlocks((prev) => prev.filter((_, i) => i !== idx))
  }

  if (loading) {
    return <div className="text-sm text-[hsl(var(--muted-foreground))]">Loading…</div>
  }

  if (!news) {
    return (
      <div className="space-y-3">
        <div className="text-sm text-red-400">Новину не знайдено.</div>
        <Button asChild variant="secondary" size="sm">
          <Link to="/news">Назад</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-28">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[hsl(var(--foreground))]">
            Редагування новини
          </h1>
          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
            ID: <span className="font-mono">{newsId}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant={lang === 'uk' ? 'default' : 'secondary'}
            size="sm"
            onClick={() => setLang('uk')}
          >
            UA
          </Button>
          <Button
            type="button"
            variant={lang === 'en' ? 'default' : 'secondary'}
            size="sm"
            onClick={() => setLang('en')}
          >
            EN
          </Button>
          {dirty ? (
            <Button
              type="button"
              disabled={saving}
              onClick={() => void save()}
            >
              {saving ? 'Зберігаю…' : 'Зберегти'}
            </Button>
          ) : null}
          <Button
            variant="secondary"
            onClick={() => setDeleteOpen(true)}
          >
            Видалити
          </Button>
          <Button variant="secondary" onClick={() => navigate('/news')}>
            До списку
          </Button>
        </div>
      </div>

      <AlertDialog
        open={deleteOpen}
        title="Видалити новину?"
        description="Також буде видалена папка з картинками на сервері."
        cancelText="Скасувати"
        confirmText={deleting ? 'Видаляю…' : 'Видалити'}
        destructive
        confirmDisabled={deleting}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={async () => {
          setDeleting(true)
          try {
            await apiFetch(`/news/${newsId}`, { method: 'DELETE' })
            toastSuccess('Видалено', 'Новину видалено.')
            navigate('/news', { replace: true })
          } catch {
            setError('Не вдалося видалити новину.')
            toastError('Помилка', 'Не вдалося видалити новину.')
          } finally {
            setDeleting(false)
            setDeleteOpen(false)
          }
        }}
      />

      <Card className="bg-[hsl(var(--card)/0.65)] backdrop-blur">
        <CardHeader>
          <CardTitle>Основне</CardTitle>
          <CardDescription>Заголовок, короткий опис, головна картинка.</CardDescription>
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
              <Label htmlFor="title">Заголовок</Label>
              <Input
                id="title"
                value={lang === 'uk' ? titleUk : titleEn}
                onChange={(e) => (lang === 'uk' ? setTitleUk(e.target.value) : setTitleEn(e.target.value))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="excerpt">Короткий опис</Label>
              <Textarea
                id="excerpt"
                value={lang === 'uk' ? excerptUk : excerptEn}
                onChange={(e) => (lang === 'uk' ? setExcerptUk(e.target.value) : setExcerptEn(e.target.value))}
                placeholder="Короткий опис для списку новин…"
              />
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
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={uploadingCover}
                  onClick={() => coverInputRef.current?.click()}
                >
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
            {error ? <p className="text-sm text-red-400">{error}</p> : null}
          </form>
        </CardContent>
      </Card>

      <Card className="bg-[hsl(var(--card)/0.65)] backdrop-blur">
        <CardHeader>
          <CardTitle>Конструктор новини</CardTitle>
          <CardDescription>Додавай блоки: текст, картинка, цитата.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="h-9 w-9 px-0"
              title="Text"
              aria-label="Add text block"
              onClick={() => addBlock('text')}
            >
              <Type className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="h-9 w-9 px-0"
              title="Image"
              aria-label="Add image block"
              onClick={() => addBlock('image')}
            >
              <ImageIcon className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="h-9 w-9 px-0"
              title="Quote"
              aria-label="Add quote block"
              onClick={() => addBlock('quote')}
            >
              <Quote className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="h-9 w-9 px-0"
              title="List"
              aria-label="Add list block"
              onClick={() => addBlock('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          {blocks.length === 0 ? (
            <div className="text-sm text-[hsl(var(--muted-foreground))]">Блоків ще немає.</div>
          ) : (
            <div className="space-y-3">
              {blocks.map((b, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card)/0.4)] p-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
                      {idx + 1}. {b.type}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-9 w-9 px-0"
                        title="Up"
                        aria-label="Move block up"
                        onClick={() => moveBlock(idx, -1)}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-9 w-9 px-0"
                        title="Down"
                        aria-label="Move block down"
                        onClick={() => moveBlock(idx, 1)}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-9 w-9 px-0"
                        title="Remove"
                        aria-label="Remove block"
                        onClick={() => removeBlock(idx)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {b.type === 'text' ? (
                    <div className="mt-3 grid gap-2">
                      <Label>Text</Label>
                      <RichTextEditor
                        value={lang === 'uk' ? b.textUk : b.textEn}
                        onChange={(html) =>
                          setBlocks((prev) =>
                            prev.map((x, i) =>
                              i === idx
                                ? { ...x, ...(lang === 'uk' ? { textUk: html } : { textEn: html }) }
                                : x,
                            ),
                          )
                        }
                        placeholder="Текст…"
                      />
                    </div>
                  ) : null}

                  {b.type === 'quote' ? (
                    <div className="mt-3 grid gap-2">
                      <Label>Quote</Label>
                      <Textarea
                        value={lang === 'uk' ? b.quoteUk : b.quoteEn}
                        onChange={(e) =>
                          setBlocks((prev) =>
                            prev.map((x, i) =>
                              i === idx
                                ? { ...x, ...(lang === 'uk' ? { quoteUk: e.target.value } : { quoteEn: e.target.value }) }
                                : x,
                            ),
                          )
                        }
                      />
                      <Label>Author</Label>
                      <Input
                        value={lang === 'uk' ? b.authorUk ?? '' : b.authorEn ?? ''}
                        onChange={(e) =>
                          setBlocks((prev) =>
                            prev.map((x, i) =>
                              i === idx
                                ? { ...x, ...(lang === 'uk' ? { authorUk: e.target.value } : { authorEn: e.target.value }) }
                                : x,
                            ),
                          )
                        }
                      />
                    </div>
                  ) : null}

                  {b.type === 'image' ? (
                    <div className="mt-3 grid gap-2">
                      <Label>Картинка</Label>
                      <div className="flex items-center gap-3">
                        <input
                          id={`block-upload-${idx}`}
                          ref={(el) => {
                            blockInputRefs.current[idx] = el
                          }}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0]
                            if (!file) return
                            try {
                              // If user just added this block (not saved yet), persist it first,
                              // otherwise the backend will return an older blocks array and we'd lose local state.
                              if (dirty) {
                                const ok = await save()
                                if (!ok) return
                              }
                              toastInfo('Завантаження…', 'Картинка блоку')
                              const form = new FormData()
                              form.append('image', file)
                              form.append('blockIndex', String(idx))
                              const updated = await apiFetch<News>(`/news/${newsId}/blocks/image`, {
                                method: 'POST',
                                body: form,
                              })
                              setNews(updated)
                              setBlocks(sanitizeBlocks(updated.blocks))
                              toastSuccess('Завантажено', 'Картинка блоку оновлена.')
                            } catch {
                              setError('Не вдалося завантажити картинку блоку.')
                              toastError('Помилка', 'Не вдалося завантажити картинку блоку.')
                            } finally {
                              e.target.value = ''
                            }
                          }}
                        />
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => blockInputRefs.current[idx]?.click()}
                        >
                          Upload
                        </Button>
                        <div className="text-xs text-[hsl(var(--muted-foreground))]">
                          {b.url ? 'Завантажено' : 'Файл не вибран'}
                        </div>
                      </div>
                      <Label>Caption</Label>
                      <Input
                        value={lang === 'uk' ? b.captionUk ?? '' : b.captionEn ?? ''}
                        onChange={(e) =>
                          setBlocks((prev) =>
                            prev.map((x, i) =>
                              i === idx
                                ? { ...x, ...(lang === 'uk' ? { captionUk: e.target.value } : { captionEn: e.target.value }) }
                                : x,
                            ),
                          )
                        }
                      />
                      {b.url ? (
                        <div className="overflow-hidden rounded-lg border border-[hsl(var(--border))]">
                          <img
                            src={`${API_BASE_URL.replace(/\/api$/, '')}${b.url}`}
                            alt=""
                            className="aspect-video w-full object-cover"
                          />
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  {b.type === 'list' ? (
                    <div className="mt-3 grid gap-2">
                      <div className="flex items-center justify-between gap-3">
                        <Label>Список</Label>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          className="h-9 px-3"
                          title={b.ordered ? 'Ordered' : 'Bullets'}
                          aria-label="Toggle list type"
                          onClick={() =>
                            setBlocks((prev) =>
                              prev.map((x, i) =>
                                i === idx ? ({ ...x, ordered: !Boolean((x as any).ordered) } as any) : x,
                              ),
                            )
                          }
                        >
                          {b.ordered ? '1.' : '•'}
                        </Button>
                      </div>
                      <Textarea
                        value={(lang === 'uk' ? b.itemsUk : b.itemsEn).join('\n')}
                        onChange={(e) => {
                          const items = e.target.value
                            .split('\n')
                            .map((s) => s.trim())
                            .filter((s) => s.length > 0)
                          setBlocks((prev) =>
                            prev.map((x, i) =>
                              i === idx
                                ? ({ ...x, ...(lang === 'uk' ? { itemsUk: items } : { itemsEn: items }) } as any)
                                : x,
                            ),
                          )
                        }}
                        placeholder="Пункт 1&#10;Пункт 2"
                      />
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}

          <div className="sticky bottom-4 z-10 mt-6 flex w-full justify-center">
            <div className="flex flex-wrap gap-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background)/0.75)] p-2 backdrop-blur">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="h-9 w-9 px-0"
                title="Text"
                aria-label="Add text block"
                onClick={() => addBlock('text')}
              >
                <Type className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="h-9 w-9 px-0"
                title="Image"
                aria-label="Add image block"
                onClick={() => addBlock('image')}
              >
                <ImageIcon className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="h-9 w-9 px-0"
                title="Quote"
                aria-label="Add quote block"
                onClick={() => addBlock('quote')}
              >
                <Quote className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="h-9 w-9 px-0"
                title="List"
                aria-label="Add list block"
                onClick={() => addBlock('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <AdminPersistFooter saving={saving} onSave={() => void save()} disabled={saving} />
    </div>
  )
}

