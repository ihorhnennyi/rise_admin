import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiFetch, ApiError } from '@admin/api/http'
import type { News, NewsBlock } from '@admin/types/news'
import { Button } from '@admin/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@admin/components/ui/card'
import { Input } from '@admin/components/ui/input'
import { Label } from '@admin/components/ui/label'
import { Textarea } from '@admin/components/ui/textarea'
import { ArrowDown, ArrowUp, Image as ImageIcon, List, Quote, Trash2, Type } from 'lucide-react'
import { RichTextEditor } from '@admin/components/RichTextEditor'
import { toastError, toastSuccess } from '@admin/lib/toast'

export function NewsCreatePage() {
  const navigate = useNavigate()
  const [lang, setLang] = useState<'uk' | 'en'>('uk')
  const [titleUk, setTitleUk] = useState('')
  const [titleEn, setTitleEn] = useState('')
  const [excerptUk, setExcerptUk] = useState('')
  const [excerptEn, setExcerptEn] = useState('')
  const [blocks, setBlocks] = useState<NewsBlock[]>([])
  const [blockFiles, setBlockFiles] = useState<Record<number, File | undefined>>({})
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const coverInputRef = useRef<HTMLInputElement | null>(null)
  const blockInputRefs = useRef<Record<number, HTMLInputElement | null>>({})

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

  const coverPreviewUrl = useMemo(
    () => (coverFile ? URL.createObjectURL(coverFile) : null),
    [coverFile],
  )

  const blockPreviewUrls = useMemo(() => {
    const out: Record<number, string> = {}
    for (const [k, file] of Object.entries(blockFiles)) {
      const idx = Number(k)
      if (!Number.isFinite(idx) || !file) continue
      out[idx] = URL.createObjectURL(file)
    }
    return out
  }, [blockFiles])

  useEffect(() => {
    return () => {
      if (coverPreviewUrl) URL.revokeObjectURL(coverPreviewUrl)
    }
  }, [coverPreviewUrl])

  useEffect(() => {
    return () => {
      Object.values(blockPreviewUrls).forEach((url) => URL.revokeObjectURL(url))
    }
  }, [blockPreviewUrls])

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
    setBlockFiles((prev) => {
      const next: Record<number, File | undefined> = {}
      Object.entries(prev).forEach(([k, v]) => {
        const i = Number(k)
        if (Number.isNaN(i)) return
        if (i === idx) return
        next[i > idx ? i - 1 : i] = v
      })
      return next
    })
  }

  async function onCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const safeBlocks = sanitizeBlocks(blocks)
      const created = await apiFetch<News>('/news', {
        method: 'POST',
        json: { titleUk, titleEn, excerptUk, excerptEn, blocks: safeBlocks },
      })
      if (coverFile) {
        const form = new FormData()
        form.append('image', coverFile)
        await apiFetch(`/news/${created._id}/cover`, {
          method: 'POST',
          body: form,
        })
      }

      const blockFileEntries = Object.entries(blockFiles)
        .map(([k, v]) => [Number(k), v] as const)
        .filter(([idx, f]) => Number.isFinite(idx) && f)
        .sort(([a], [b]) => a - b) as Array<[number, File]>

      for (const [blockIndex, file] of blockFileEntries) {
        const form = new FormData()
        form.append('image', file)
        form.append('blockIndex', String(blockIndex))
        await apiFetch(`/news/${created._id}/blocks/image`, {
          method: 'POST',
          body: form,
        })
      }

      toastSuccess('Створено', 'Новину створено успішно.')
      navigate(`/news/${created._id}`, { replace: true })
    } catch (e) {
      if (e instanceof ApiError) setError('Не вдалося створити новину.')
      else setError('Помилка. Спробуй ще раз.')
      toastError('Помилка', 'Не вдалося створити новину.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[hsl(var(--foreground))]">
          Створити новину
        </h1>
        <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
          Після створення можна додати картинки.
        </p>
      </div>

      <Card className="bg-[hsl(var(--card)/0.65)] backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-3">
            <span>Дані новини</span>
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
            </div>
          </CardTitle>
          <CardDescription>Заголовок, короткий опис, головна картинка.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4" onSubmit={onCreate}>
            <div className="grid gap-2">
              <Label htmlFor="title">Заголовок</Label>
              <Input
                id="title"
                value={lang === 'uk' ? titleUk : titleEn}
                onChange={(e) => (lang === 'uk' ? setTitleUk(e.target.value) : setTitleEn(e.target.value))}
                required
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
              <Label htmlFor="cover">Головна картинка</Label>
              <div className="flex items-center gap-3">
                <input
                  ref={coverInputRef}
                  id="cover"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={saving}
                  onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={saving}
                  onClick={() => coverInputRef.current?.click()}
                >
                  Вибрати файл
                </Button>
                <div className="text-xs text-[hsl(var(--muted-foreground))]">
                  {coverFile ? coverFile.name : 'Файл не вибран'}
                </div>
              </div>
              {coverPreviewUrl ? (
                <div className="overflow-hidden rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card)/0.4)]">
                  <img
                    src={coverPreviewUrl}
                    alt=""
                    className="aspect-[21/7] w-full object-cover"
                  />
                </div>
              ) : null}
            </div>

            <div className="grid gap-2">
              <Label>Конструктор новини</Label>
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
                          <RichTextEditor
                            value={lang === 'uk' ? b.textUk : b.textEn}
                            onChange={(html) =>
                              setBlocks((prev) =>
                                prev.map((x, i) =>
                                  i === idx
                                    ? {
                                        ...x,
                                        ...(lang === 'uk' ? { textUk: html } : { textEn: html }),
                                      }
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
                          <Textarea
                            value={lang === 'uk' ? b.quoteUk : b.quoteEn}
                            onChange={(e) =>
                              setBlocks((prev) =>
                                prev.map((x, i) =>
                                  i === idx
                                    ? {
                                        ...x,
                                        ...(lang === 'uk' ? { quoteUk: e.target.value } : { quoteEn: e.target.value }),
                                      }
                                    : x,
                                ),
                              )
                            }
                          />
                          <Input
                            value={lang === 'uk' ? b.authorUk ?? '' : b.authorEn ?? ''}
                            onChange={(e) =>
                              setBlocks((prev) =>
                                prev.map((x, i) =>
                                  i === idx
                                    ? {
                                        ...x,
                                        ...(lang === 'uk' ? { authorUk: e.target.value } : { authorEn: e.target.value }),
                                      }
                                    : x,
                                ),
                              )
                            }
                            placeholder="Author"
                          />
                        </div>
                      ) : null}

                      {b.type === 'image' ? (
                        <div className="mt-3 grid gap-2">
                          <div className="flex items-center gap-3">
                            <input
                              id={`create-block-upload-${idx}`}
                              ref={(el) => {
                                blockInputRefs.current[idx] = el
                              }}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              disabled={saving}
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (!file) return
                                setBlockFiles((prev) => ({ ...prev, [idx]: file }))
                                e.target.value = ''
                              }}
                            />
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              disabled={saving}
                              onClick={() => blockInputRefs.current[idx]?.click()}
                            >
                              Upload
                            </Button>
                            <div className="text-xs text-[hsl(var(--muted-foreground))]">
                              {blockFiles[idx]?.name ?? 'Файл не вибран'}
                            </div>
                          </div>
                          <Input
                            value={lang === 'uk' ? b.captionUk ?? '' : b.captionEn ?? ''}
                            onChange={(e) =>
                              setBlocks((prev) =>
                                prev.map((x, i) =>
                                  i === idx
                                    ? {
                                        ...x,
                                        ...(lang === 'uk'
                                          ? { captionUk: e.target.value }
                                          : { captionEn: e.target.value }),
                                      }
                                    : x,
                                ),
                              )
                            }
                            placeholder="Caption"
                          />
                          {blockPreviewUrls[idx] ? (
                            <div className="overflow-hidden rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card)/0.4)]">
                              <img
                                src={blockPreviewUrls[idx]}
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
                            <div className="text-xs text-[hsl(var(--muted-foreground))]">Items (1 per line)</div>
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
                                    ? ({
                                        ...x,
                                        ...(lang === 'uk' ? { itemsUk: items } : { itemsEn: items }),
                                      } as any)
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
            </div>

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

            {error ? <p className="text-sm text-red-400">{error}</p> : null}

            <div className="flex gap-2">
              <Button type="submit" disabled={saving}>
                {saving ? 'Створюю…' : 'Створити'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate('/news')}
              >
                Назад
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

