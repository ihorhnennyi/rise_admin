import { useCallback, useEffect, useMemo, useState } from 'react'
import { apiFetch, ApiError } from '@admin/api/http'
import type { Partner } from '@admin/types/partners'
import { API_BASE_URL } from '@admin/api/config'
import { Button } from '@admin/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@admin/components/ui/card'
import { Input } from '@admin/components/ui/input'
import { Label } from '@admin/components/ui/label'
import { AlertDialog } from '@admin/components/ui/alert-dialog'
import { toastError, toastSuccess } from '@admin/lib/toast'
import { AdminPersistFooter } from '@admin/components/AdminPersistFooter'
import { usePersistedJsonAutosave } from '@admin/hooks/usePersistedJsonAutosave'
import { ImageUp, Save, Trash2 } from 'lucide-react'

type SiteSettingsPublic = {
  partnersTitleUk?: string
  partnersTitleEn?: string
  partnersDescriptionUk?: string
  partnersDescriptionEn?: string
}

function assetUrl(path: string | null) {
  if (!path) return ''
  const origin = API_BASE_URL.replace(/\/api$/, '')
  return `${origin}${path}`
}

export function PartnersPage() {
  const [items, setItems] = useState<Partner[]>([])
  const [loading, setLoading] = useState(true)
  const [altUkDrafts, setAltUkDrafts] = useState<Record<string, string>>({})
  const [altEnDrafts, setAltEnDrafts] = useState<Record<string, string>>({})
  const [hrefDrafts, setHrefDrafts] = useState<Record<string, string>>({})
  const [imageUrlDrafts, setImageUrlDrafts] = useState<Record<string, string>>({})
  const [newAltUk, setNewAltUk] = useState('')
  const [newAltEn, setNewAltEn] = useState('')
  const [newHref, setNewHref] = useState('')
  const [newImageUrl, setNewImageUrl] = useState('')
  const [newFile, setNewFile] = useState<File | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const [lang, setLang] = useState<'uk' | 'en'>('uk')
  const [savingTexts, setSavingTexts] = useState(false)
  const [partnersTitleUk, setPartnersTitleUk] = useState('')
  const [partnersTitleEn, setPartnersTitleEn] = useState('')
  const [partnersDescriptionUk, setPartnersDescriptionUk] = useState('')
  const [partnersDescriptionEn, setPartnersDescriptionEn] = useState('')
  const [sectionBaselineJson, setSectionBaselineJson] = useState<string | null>(null)

  const sectionPatchJson = useMemo(
    () =>
      JSON.stringify({
        partnersTitleUk,
        partnersTitleEn,
        partnersDescriptionUk,
        partnersDescriptionEn,
      }),
    [partnersTitleUk, partnersTitleEn, partnersDescriptionUk, partnersDescriptionEn],
  )

  const sectionDirty = sectionBaselineJson !== null && sectionPatchJson !== sectionBaselineJson

  const load = useCallback(async () => {
    try {
      const [data, settings] = await Promise.all([
        apiFetch<Partner[]>('/partners'),
        apiFetch<SiteSettingsPublic>('/settings'),
      ])
      setItems(data)
      const uk: Record<string, string> = {}
      const en: Record<string, string> = {}
      const hrefs: Record<string, string> = {}
      const imgUrls: Record<string, string> = {}
      for (const p of data) {
        uk[p._id] = p.altUk ?? ''
        en[p._id] = p.altEn ?? ''
        hrefs[p._id] = p.href ?? ''
        imgUrls[p._id] = p.imageUrl ?? ''
      }
      setAltUkDrafts(uk)
      setAltEnDrafts(en)
      setHrefDrafts(hrefs)
      setImageUrlDrafts(imgUrls)

      setPartnersTitleUk(settings.partnersTitleUk ?? '')
      setPartnersTitleEn(settings.partnersTitleEn ?? '')
      setPartnersDescriptionUk(settings.partnersDescriptionUk ?? '')
      setPartnersDescriptionEn(settings.partnersDescriptionEn ?? '')
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) return
      toastError('Помилка', 'Не вдалося завантажити партнерів.')
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (loading) {
      setSectionBaselineJson(null)
      return
    }
    setSectionBaselineJson((prev) => (prev === null ? sectionPatchJson : prev))
  }, [loading, sectionPatchJson])

  const saveSectionTexts = useCallback(
    async (opts?: { silent?: boolean }) => {
      const silent = opts?.silent === true
      if (silent && sectionPatchJson === sectionBaselineJson) return
      setSavingTexts(true)
      try {
        const updated = await apiFetch<SiteSettingsPublic>('/settings', {
          method: 'PATCH',
          json: {
            partnersTitleUk,
            partnersTitleEn,
            partnersDescriptionUk,
            partnersDescriptionEn,
          },
        })
        setSectionBaselineJson(
          JSON.stringify({
            partnersTitleUk: updated.partnersTitleUk ?? '',
            partnersTitleEn: updated.partnersTitleEn ?? '',
            partnersDescriptionUk: updated.partnersDescriptionUk ?? '',
            partnersDescriptionEn: updated.partnersDescriptionEn ?? '',
          }),
        )
        if (!silent) toastSuccess('Збережено', 'Заголовок та опис оновлено.')
      } catch {
        toastError('Помилка', silent ? 'Автозбереження не вдалося.' : 'Не вдалося зберегти заголовок/опис.')
      } finally {
        setSavingTexts(false)
      }
    },
    [
      partnersTitleUk,
      partnersTitleEn,
      partnersDescriptionUk,
      partnersDescriptionEn,
      sectionPatchJson,
      sectionBaselineJson,
    ],
  )

  const { persistBlur: persistSectionBlur } = usePersistedJsonAutosave({
    loading,
    isDirty: sectionDirty,
    patchJson: sectionPatchJson,
    saveSilent: () => saveSectionTexts({ silent: true }),
  })

  async function savePartnerMeta(id: string) {
    const altUk = (altUkDrafts[id] ?? '').trim()
    const altEn = (altEnDrafts[id] ?? '').trim()
    const href = (hrefDrafts[id] ?? '').trim()
    const imageUrl = (imageUrlDrafts[id] ?? '').trim()
    if (!altUk) {
      toastError('Помилка', 'Вкажіть alt (UA).')
      return
    }
    setSavingId(id)
    try {
      await apiFetch<Partner>(`/partners/${id}`, {
        method: 'PATCH',
        json: { altUk, altEn, href, imageUrl },
      })
      toastSuccess('Збережено', 'Дані партнера оновлено.')
      await load()
    } catch {
      toastError('Помилка', 'Не вдалося зберегти.')
    } finally {
      setSavingId(null)
    }
  }

  async function uploadImage(id: string, file: File) {
    setSavingId(id)
    try {
      const form = new FormData()
      form.append('image', file)
      await apiFetch(`/partners/${id}/image`, { method: 'POST', body: form })
      toastSuccess('Завантажено', 'Зображення оновлено.')
      await load()
    } catch {
      toastError('Помилка', 'Не вдалося завантажити зображення.')
    } finally {
      setSavingId(null)
    }
  }

  async function removeConfirmed(id: string) {
    setSavingId(id)
    try {
      await apiFetch(`/partners/${id}`, { method: 'DELETE' })
      toastSuccess('Видалено', 'Запис видалено.')
      await load()
    } catch {
      toastError('Помилка', 'Не вдалося видалити.')
    } finally {
      setSavingId(null)
    }
  }

  async function addPartner(e: React.FormEvent) {
    e.preventDefault()
    const altUk = newAltUk.trim()
    const altEn = newAltEn.trim()
    const href = newHref.trim()
    if (!altUk) {
      toastError('Помилка', 'Вкажіть alt (UA).')
      return
    }
    const imageUrl = newImageUrl.trim()
    if (!imageUrl && !newFile) {
      toastError('Помилка', 'Додайте URL картинки або виберіть файл.')
      return
    }
    setAdding(true)
    try {
      const created = await apiFetch<Partner>('/partners', {
        method: 'POST',
        json: { altUk, altEn, href, imageUrl: imageUrl || undefined },
      })
      if (newFile) {
        const form = new FormData()
        form.append('image', newFile)
        await apiFetch(`/partners/${created._id}/image`, { method: 'POST', body: form })
      }
      setNewAltUk('')
      setNewAltEn('')
      setNewHref('')
      setNewImageUrl('')
      setNewFile(null)
      toastSuccess('Додано', 'Партнера додано.')
      await load()
    } catch {
      toastError('Помилка', 'Не вдалося додати партнера.')
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className={`space-y-8 ${loading ? '' : 'pb-28'}`}>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[hsl(var(--foreground))]">Партнери</h1>
        <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
          Логотипи партнерів для сайту, alt (UA/EN) та посилання.
        </p>
      </div>

      <Card className="bg-[hsl(var(--card)/0.65)] backdrop-blur">
        <CardHeader>
          <CardTitle>Заголовок і опис блоку</CardTitle>
          <CardDescription>Це заголовок/опис секції “Наші партнери” на сайті (UA/EN).</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="flex gap-2">
            <Button type="button" size="sm" variant={lang === 'uk' ? 'default' : 'secondary'} onClick={() => setLang('uk')}>
              UA
            </Button>
            <Button type="button" size="sm" variant={lang === 'en' ? 'default' : 'secondary'} onClick={() => setLang('en')}>
              EN
            </Button>
          </div>

          <div className="grid gap-2">
            <Label>Заголовок</Label>
            <Input
              value={lang === 'uk' ? partnersTitleUk : partnersTitleEn}
              onChange={(e) => (lang === 'uk' ? setPartnersTitleUk(e.target.value) : setPartnersTitleEn(e.target.value))}
              onBlur={persistSectionBlur}
              placeholder={lang === 'uk' ? 'Наші партнери' : 'Our partners'}
            />
          </div>

          <div className="grid gap-2">
            <Label>Опис</Label>
            <textarea
              className="min-h-[96px] w-full rounded-md border border-[hsl(var(--border))] bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-[hsl(var(--muted-foreground))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
              value={lang === 'uk' ? partnersDescriptionUk : partnersDescriptionEn}
              onChange={(e) =>
                lang === 'uk' ? setPartnersDescriptionUk(e.target.value) : setPartnersDescriptionEn(e.target.value)
              }
              onBlur={persistSectionBlur}
              placeholder={lang === 'uk' ? 'Короткий опис…' : 'Short description…'}
            />
          </div>

          <div className="flex justify-end">
            <Button type="button" size="sm" disabled={savingTexts} onClick={() => void saveSectionTexts()}>
              {savingTexts ? 'Збереження…' : 'Зберегти'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-[hsl(var(--card)/0.65)] backdrop-blur">
        <CardHeader>
          <CardTitle>Додати партнера</CardTitle>
          <CardDescription>Зображення та alt (UA) — обовʼязкові. EN та посилання — опційні.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end" onSubmit={addPartner}>
            <div className="grid min-w-[200px] flex-1 gap-2">
              <Label htmlFor="new-alt-uk">Alt (UA)</Label>
              <Input
                id="new-alt-uk"
                value={newAltUk}
                onChange={(e) => setNewAltUk(e.target.value)}
                placeholder="Наприклад: Логотип компанії…"
              />
            </div>
            <div className="grid min-w-[200px] flex-1 gap-2">
              <Label htmlFor="new-alt-en">Alt (EN)</Label>
              <Input
                id="new-alt-en"
                value={newAltEn}
                onChange={(e) => setNewAltEn(e.target.value)}
                placeholder="Example company logo…"
              />
            </div>
            <div className="grid min-w-[240px] flex-1 gap-2">
              <Label htmlFor="new-href">Посилання</Label>
              <Input
                id="new-href"
                value={newHref}
                onChange={(e) => setNewHref(e.target.value)}
                placeholder="https://partner.com"
              />
            </div>
            <div className="grid min-w-[260px] flex-1 gap-2">
              <Label htmlFor="new-image-url">URL картинки</Label>
              <Input
                id="new-image-url"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                placeholder="https://cdn.site/logo.png"
              />
            </div>
            <div className="grid min-w-[200px] gap-2">
              <Label htmlFor="new-img">Зображення</Label>
              <Input
                id="new-img"
                type="file"
                accept="image/*"
                onChange={(e) => setNewFile(e.target.files?.[0] ?? null)}
              />
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
            <CardTitle>Поки що немає партнерів</CardTitle>
            <CardDescription>Додай першого партнера у формі вище.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((p) => (
            <Card key={p._id} className="bg-[hsl(var(--card)/0.65)] backdrop-blur">
              <CardHeader className="space-y-1 pb-2">
                <CardTitle className="text-base">Партнер</CardTitle>
                <CardDescription className="text-xs">
                  {p.updatedAt ? `Оновлено: ${new Date(p.updatedAt).toLocaleString()}` : ''}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="overflow-hidden rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card)/0.4)]">
                  {p.imageUrl ? (
                    <img
                      src={assetUrl(p.imageUrl)}
                      alt={altUkDrafts[p._id] ?? ''}
                      className="h-32 w-full object-contain p-3"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-32 items-center justify-center text-sm text-[hsl(var(--muted-foreground))]">
                      Немає зображення
                    </div>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor={`alt-uk-${p._id}`}>Alt (UA)</Label>
                  <Input
                    id={`alt-uk-${p._id}`}
                    value={altUkDrafts[p._id] ?? ''}
                    onChange={(e) => setAltUkDrafts((prev) => ({ ...prev, [p._id]: e.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor={`alt-en-${p._id}`}>Alt (EN)</Label>
                  <Input
                    id={`alt-en-${p._id}`}
                    value={altEnDrafts[p._id] ?? ''}
                    onChange={(e) => setAltEnDrafts((prev) => ({ ...prev, [p._id]: e.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor={`href-${p._id}`}>Посилання</Label>
                  <Input
                    id={`href-${p._id}`}
                    value={hrefDrafts[p._id] ?? ''}
                    onChange={(e) => setHrefDrafts((prev) => ({ ...prev, [p._id]: e.target.value }))}
                    placeholder="https://partner.com"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor={`img-${p._id}`}>URL картинки</Label>
                  <Input
                    id={`img-${p._id}`}
                    value={imageUrlDrafts[p._id] ?? ''}
                    onChange={(e) => setImageUrlDrafts((prev) => ({ ...prev, [p._id]: e.target.value }))}
                    placeholder="https://cdn.site/logo.png"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    disabled={savingId === p._id}
                    onClick={() => void savePartnerMeta(p._id)}
                  >
                    <Save className="size-4" aria-hidden />
                    <span className="sr-only">Зберегти</span>
                  </Button>
                  <input
                    id={`partner-file-${p._id}`}
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      e.target.value = ''
                      if (f) void uploadImage(p._id, f)
                    }}
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    disabled={savingId === p._id}
                    onClick={() => document.getElementById(`partner-file-${p._id}`)?.click()}
                  >
                    <ImageUp className="size-4" aria-hidden />
                    <span className="sr-only">Замінити зображення</span>
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="text-red-600 hover:bg-red-500/10 hover:text-red-700"
                    disabled={savingId === p._id}
                    onClick={() => {
                      setDeleteId(p._id)
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
        title="Видалити партнера?"
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

      {!loading ? (
        <AdminPersistFooter saving={savingTexts} onSave={() => void saveSectionTexts()} disabled={savingTexts} />
      ) : null}
    </div>
  )
}
