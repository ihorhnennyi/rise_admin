import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiFetch } from '@admin/api/http'
import { API_BASE_URL } from '@admin/api/config'
import { Button } from '@admin/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@admin/components/ui/card'
import { Input } from '@admin/components/ui/input'
import { Label } from '@admin/components/ui/label'
import { Textarea } from '@admin/components/ui/textarea'
import { toastError, toastSuccess } from '@admin/lib/toast'
import { BarChart3, ChevronRight, Users } from 'lucide-react'

type SiteSettingsPublic = {
  homeLogoUrl: string | null
  homeHeroTitleUk?: string
  homeHeroTitleEn?: string
  homeHeroDescriptionUk?: string
  homeHeroDescriptionEn?: string
  homeHeroCtaLabelUk?: string
  homeHeroCtaLabelEn?: string
  homeHeroCtaHrefUk?: string
  homeHeroCtaHrefEn?: string
  homeHeroImageUrl?: string | null
  instagramMosaicPostUrls?: string[]
  instagramMosaicImageUrls?: (string | null)[]
  instagramSectionTitleUk?: string
  instagramSectionTitleEn?: string
  instagramSectionDescriptionUk?: string
  instagramSectionDescriptionEn?: string
  instagramSectionCtaLabelUk?: string
  instagramSectionCtaLabelEn?: string
  instagramSectionCtaHrefUk?: string
  instagramSectionCtaHrefEn?: string
}

type UsersListResponse = {
  meta: { total: number }
}

type AnalyticsOverview = {
  totalPageViews: number
  uniqueSessions: number
}

const IG_MOSAIC_HINTS = [
  'кол. 1, зверху',
  'кол. 1, знизу',
  'кол. 2, висока',
  'центр',
  'кол. 4, висока',
  'кол. 5, зверху',
  'кол. 5, знизу',
] as const

function igImageUrlsFromApi(data: SiteSettingsPublic): string[] {
  const imgs = data.instagramMosaicImageUrls
  return Array.from({ length: 7 }, (_, i) => {
    const raw = Array.isArray(imgs) ? imgs[i] : null
    return typeof raw === 'string' && raw.trim().length > 0 ? raw.trim() : ''
  })
}

export function DashboardPage() {
  const [settings, setSettings] = useState<SiteSettingsPublic | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadingHeroImage, setUploadingHeroImage] = useState(false)
  const [statsLoading, setStatsLoading] = useState(true)
  const [userTotal, setUserTotal] = useState<number | null>(null)
  const [pageViews7d, setPageViews7d] = useState<number | null>(null)
  const [sessions7d, setSessions7d] = useState<number | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const heroImageInputRef = useRef<HTMLInputElement | null>(null)

  const [homeHeroTitleUk, setHomeHeroTitleUk] = useState('')
  const [homeHeroTitleEn, setHomeHeroTitleEn] = useState('')
  const [homeHeroDescriptionUk, setHomeHeroDescriptionUk] = useState('')
  const [homeHeroDescriptionEn, setHomeHeroDescriptionEn] = useState('')
  const [homeHeroCtaLabelUk, setHomeHeroCtaLabelUk] = useState('')
  const [homeHeroCtaLabelEn, setHomeHeroCtaLabelEn] = useState('')
  const [homeHeroCtaHrefUk, setHomeHeroCtaHrefUk] = useState('')
  const [homeHeroCtaHrefEn, setHomeHeroCtaHrefEn] = useState('')
  const [heroSaving, setHeroSaving] = useState(false)

  const [igImageUrls, setIgImageUrls] = useState<string[]>(() => Array.from({ length: 7 }, () => ''))
  const [instagramSectionTitleUk, setInstagramSectionTitleUk] = useState('')
  const [instagramSectionTitleEn, setInstagramSectionTitleEn] = useState('')
  const [instagramSectionDescriptionUk, setInstagramSectionDescriptionUk] = useState('')
  const [instagramSectionDescriptionEn, setInstagramSectionDescriptionEn] = useState('')
  const [instagramSectionCtaLabelUk, setInstagramSectionCtaLabelUk] = useState('')
  const [instagramSectionCtaLabelEn, setInstagramSectionCtaLabelEn] = useState('')
  const [instagramSectionCtaHrefUk, setInstagramSectionCtaHrefUk] = useState('')
  const [instagramSectionCtaHrefEn, setInstagramSectionCtaHrefEn] = useState('')
  const [instagramSaving, setInstagramSaving] = useState(false)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const data = await apiFetch<SiteSettingsPublic>('/settings')
        if (!cancelled) {
          setSettings(data)
          setHomeHeroTitleUk(data.homeHeroTitleUk ?? '')
          setHomeHeroTitleEn(data.homeHeroTitleEn ?? '')
          setHomeHeroDescriptionUk(data.homeHeroDescriptionUk ?? '')
          setHomeHeroDescriptionEn(data.homeHeroDescriptionEn ?? '')
          setHomeHeroCtaLabelUk(data.homeHeroCtaLabelUk ?? '')
          setHomeHeroCtaLabelEn(data.homeHeroCtaLabelEn ?? '')
          setHomeHeroCtaHrefUk(data.homeHeroCtaHrefUk ?? '')
          setHomeHeroCtaHrefEn(data.homeHeroCtaHrefEn ?? '')
          setIgImageUrls(igImageUrlsFromApi(data))
          setInstagramSectionTitleUk(data.instagramSectionTitleUk ?? '')
          setInstagramSectionTitleEn(data.instagramSectionTitleEn ?? '')
          setInstagramSectionDescriptionUk(data.instagramSectionDescriptionUk ?? '')
          setInstagramSectionDescriptionEn(data.instagramSectionDescriptionEn ?? '')
          setInstagramSectionCtaLabelUk(data.instagramSectionCtaLabelUk ?? '')
          setInstagramSectionCtaLabelEn(data.instagramSectionCtaLabelEn ?? '')
          setInstagramSectionCtaHrefUk(data.instagramSectionCtaHrefUk ?? '')
          setInstagramSectionCtaHrefEn(data.instagramSectionCtaHrefEn ?? '')
        }
      } catch {
        if (!cancelled) setSettings({ homeLogoUrl: null })
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      setStatsLoading(true)
      try {
        const [usersRes, overviewRes] = await Promise.all([
          apiFetch<UsersListResponse>('/users?page=1&limit=1'),
          apiFetch<AnalyticsOverview>('/analytics/overview?days=7'),
        ])
        if (!cancelled) {
          setUserTotal(usersRes.meta?.total ?? 0)
          setPageViews7d(overviewRes.totalPageViews ?? 0)
          setSessions7d(overviewRes.uniqueSessions ?? 0)
        }
      } catch {
        if (!cancelled) {
          setUserTotal(null)
          setPageViews7d(null)
          setSessions7d(null)
        }
      } finally {
        if (!cancelled) setStatsLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  async function onUpload(file: File | null) {
    if (!file) return
    setUploading(true)
    try {
      const form = new FormData()
      form.append('image', file)
      const updated = await apiFetch<SiteSettingsPublic>('/settings/home-logo', {
        method: 'POST',
        body: form,
      })
      setSettings(updated)
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  async function onHeroImageUpload(file: File | null) {
    if (!file) return
    setUploadingHeroImage(true)
    try {
      const form = new FormData()
      form.append('image', file)
      const updated = await apiFetch<SiteSettingsPublic>('/settings/home-hero-image', {
        method: 'POST',
        body: form,
      })
      setSettings(updated)
      toastSuccess('Завантажено', 'Фото першого екрану оновлено.')
    } catch {
      toastError('Помилка', 'Не вдалося завантажити фото.')
    } finally {
      setUploadingHeroImage(false)
      if (heroImageInputRef.current) heroImageInputRef.current.value = ''
    }
  }

  async function saveHomeHero() {
    setHeroSaving(true)
    try {
      const updated = await apiFetch<SiteSettingsPublic>('/settings', {
        method: 'PATCH',
        json: {
          homeHeroTitleUk,
          homeHeroTitleEn,
          homeHeroDescriptionUk,
          homeHeroDescriptionEn,
          homeHeroCtaLabelUk,
          homeHeroCtaLabelEn,
          homeHeroCtaHrefUk,
          homeHeroCtaHrefEn,
        },
      })
      setSettings(updated)
      setHomeHeroTitleUk(updated.homeHeroTitleUk ?? '')
      setHomeHeroTitleEn(updated.homeHeroTitleEn ?? '')
      setHomeHeroDescriptionUk(updated.homeHeroDescriptionUk ?? '')
      setHomeHeroDescriptionEn(updated.homeHeroDescriptionEn ?? '')
      setHomeHeroCtaLabelUk(updated.homeHeroCtaLabelUk ?? '')
      setHomeHeroCtaLabelEn(updated.homeHeroCtaLabelEn ?? '')
      setHomeHeroCtaHrefUk(updated.homeHeroCtaHrefUk ?? '')
      setHomeHeroCtaHrefEn(updated.homeHeroCtaHrefEn ?? '')
      toastSuccess('Збережено', 'Текст банера на головній оновлено.')
    } catch {
      toastError('Помилка', 'Не вдалося зберегти банер.')
    } finally {
      setHeroSaving(false)
    }
  }

  async function saveInstagramBlock() {
    setInstagramSaving(true)
    try {
      const updated = await apiFetch<SiteSettingsPublic>('/settings', {
        method: 'PATCH',
        json: {
          instagramMosaicPostUrls: Array.from({ length: 7 }, () => ''),
          instagramMosaicImageUrls: igImageUrls.map((s) => s.trim()),
          instagramSectionTitleUk,
          instagramSectionTitleEn,
          instagramSectionDescriptionUk,
          instagramSectionDescriptionEn,
          instagramSectionCtaLabelUk,
          instagramSectionCtaLabelEn,
          instagramSectionCtaHrefUk,
          instagramSectionCtaHrefEn,
        },
      })
      setSettings(updated)
      setIgImageUrls(igImageUrlsFromApi(updated))
      setInstagramSectionTitleUk(updated.instagramSectionTitleUk ?? '')
      setInstagramSectionTitleEn(updated.instagramSectionTitleEn ?? '')
      setInstagramSectionDescriptionUk(updated.instagramSectionDescriptionUk ?? '')
      setInstagramSectionDescriptionEn(updated.instagramSectionDescriptionEn ?? '')
      setInstagramSectionCtaLabelUk(updated.instagramSectionCtaLabelUk ?? '')
      setInstagramSectionCtaLabelEn(updated.instagramSectionCtaLabelEn ?? '')
      setInstagramSectionCtaHrefUk(updated.instagramSectionCtaHrefUk ?? '')
      setInstagramSectionCtaHrefEn(updated.instagramSectionCtaHrefEn ?? '')
      toastSuccess('Збережено', 'Блок Instagram на головній оновлено.')
    } catch {
      toastError('Помилка', 'Не вдалося зберегти блок Instagram.')
    } finally {
      setInstagramSaving(false)
    }
  }

  const origin = API_BASE_URL.replace(/\/api$/, '')
  const previewSrc = settings?.homeLogoUrl
    ? settings.homeLogoUrl.startsWith('http')
      ? settings.homeLogoUrl
      : `${origin}${settings.homeLogoUrl}`
    : null

  const previewHeroImageSrc = settings?.homeHeroImageUrl
    ? settings.homeHeroImageUrl.startsWith('http')
      ? settings.homeHeroImageUrl
      : `${origin}${settings.homeHeroImageUrl}`
    : null

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-[hsl(var(--foreground))]">Основна інформація</h1>
      <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">Швидкі налаштування сайту та зведення.</p>

      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-[hsl(var(--card)/0.65)] backdrop-blur">
          <CardHeader>
            <CardTitle>Логотип на сайті</CardTitle>
            <CardDescription>
              PNG / JPG / SVG до 25&nbsp;МБ. Показується в шапці замість стандартного{' '}
              <code className="text-xs">/logo.svg</code>.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {loading ? (
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Завантаження…</p>
            ) : (
              <>
                <div className="grid gap-2">
                  <Label>Поточний логотип</Label>
                  <div className="flex min-h-[72px] items-center justify-center rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card)/0.5)] p-4">
                    {previewSrc ? (
                      <img src={previewSrc} alt="" className="max-h-14 max-w-[200px] object-contain" loading="lazy" />
                    ) : (
                      <span className="text-sm text-[hsl(var(--muted-foreground))]">Ще не завантажено</span>
                    )}
                  </div>
                </div>
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => void onUpload(e.target.files?.[0] ?? null)}
                />
                <Button type="button" variant="secondary" size="sm" disabled={uploading} onClick={() => inputRef.current?.click()}>
                  {uploading ? 'Завантажую…' : 'Вибрати файл'}
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="bg-[hsl(var(--card)/0.65)] backdrop-blur">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-[hsl(var(--muted-foreground))]" aria-hidden />
              <CardTitle>Користувачі</CardTitle>
            </div>
            <CardDescription>Облікові записи та ролі CMS</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {statsLoading ? (
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Завантаження…</p>
            ) : userTotal === null ? (
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Не вдалося завантажити дані.</p>
            ) : (
              <p className="text-3xl font-semibold tabular-nums text-[hsl(var(--foreground))]">{userTotal}</p>
            )}
            <Button variant="secondary" size="sm" className="w-full justify-between border border-[hsl(var(--border))]" asChild>
              <Link to="/users">
                Керування
                <ChevronRight className="h-4 w-4 opacity-70" aria-hidden />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-[hsl(var(--card)/0.65)] backdrop-blur md:col-span-2 lg:col-span-1">
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-[hsl(var(--muted-foreground))]" aria-hidden />
              <CardTitle>Аналітика</CardTitle>
            </div>
            <CardDescription>Перегляди за останні 7 днів (без ботів)</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {statsLoading ? (
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Завантаження…</p>
            ) : pageViews7d === null ? (
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Не вдалося завантажити дані.</p>
            ) : (
              <>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-[hsl(var(--muted-foreground))]">Перегляди</p>
                  <p className="text-2xl font-semibold tabular-nums">{pageViews7d}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-[hsl(var(--muted-foreground))]">Сесії</p>
                  <p className="text-2xl font-semibold tabular-nums">{sessions7d ?? '—'}</p>
                </div>
              </>
            )}
            <Button variant="secondary" size="sm" className="w-full justify-between border border-[hsl(var(--border))]" asChild>
              <Link to="/analytics">
                Детальна аналітика
                <ChevronRight className="h-4 w-4 opacity-70" aria-hidden />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-[hsl(var(--card)/0.65)] backdrop-blur md:col-span-2 lg:col-span-3">
          <CardHeader>
            <CardTitle>Банер на головній (перший екран)</CardTitle>
            <CardDescription>
              Фото фону першого екрану, далі текст банера. Якщо поле тексту порожнє — підставляється значення за
              замовчуванням. Посилання кнопки: окремо для UK та EN; якщо одне порожнє — береться інше, інакше{' '}
              <code className="text-xs">/help</code>. У формі зліва українська, справа англійська.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
            {loading ? (
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Завантаження…</p>
            ) : (
              <>
                <div className="grid gap-2">
                  <Label>Фото першого екрану (фон)</Label>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">
                    JPG / PNG / WebP до 25&nbsp;МБ. Якщо не завантажено — на сайті залишається стандартне{' '}
                    <code className="text-[11px]">/header.jpg</code>.
                  </p>
                  <div className="overflow-hidden rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card)/0.5)]">
                    {previewHeroImageSrc ? (
                      <img
                        src={previewHeroImageSrc}
                        alt=""
                        className="aspect-[21/9] max-h-48 w-full object-cover sm:max-h-56"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex aspect-[21/9] max-h-48 items-center justify-center sm:max-h-56">
                        <span className="text-sm text-[hsl(var(--muted-foreground))]">Стандартне фото сайту</span>
                      </div>
                    )}
                  </div>
                  <input
                    ref={heroImageInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploadingHeroImage}
                    onChange={(e) => void onHeroImageUpload(e.target.files?.[0] ?? null)}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={uploadingHeroImage}
                    onClick={() => heroImageInputRef.current?.click()}
                  >
                    {uploadingHeroImage ? 'Завантажую…' : 'Вибрати фото'}
                  </Button>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="hero-title-uk">Заголовок (українська)</Label>
                    <Input
                      id="hero-title-uk"
                      value={homeHeroTitleUk}
                      onChange={(e) => setHomeHeroTitleUk(e.target.value)}
                      placeholder="БФ Rise of Ukraine"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="hero-title-en">Заголовок (англійська)</Label>
                    <Input
                      id="hero-title-en"
                      value={homeHeroTitleEn}
                      onChange={(e) => setHomeHeroTitleEn(e.target.value)}
                      placeholder="Rise of Ukraine Charitable Foundation"
                    />
                  </div>
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="hero-desc-uk">Опис (українська)</Label>
                    <Textarea
                      id="hero-desc-uk"
                      rows={4}
                      value={homeHeroDescriptionUk}
                      onChange={(e) => setHomeHeroDescriptionUk(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="hero-desc-en">Опис (англійська)</Label>
                    <Textarea
                      id="hero-desc-en"
                      rows={4}
                      value={homeHeroDescriptionEn}
                      onChange={(e) => setHomeHeroDescriptionEn(e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="hero-cta-uk">Текст кнопки (українська)</Label>
                    <Input
                      id="hero-cta-uk"
                      value={homeHeroCtaLabelUk}
                      onChange={(e) => setHomeHeroCtaLabelUk(e.target.value)}
                      placeholder="Отримати допомогу"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="hero-cta-en">Текст кнопки (англійська)</Label>
                    <Input
                      id="hero-cta-en"
                      value={homeHeroCtaLabelEn}
                      onChange={(e) => setHomeHeroCtaLabelEn(e.target.value)}
                      placeholder="Get help"
                    />
                  </div>
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="hero-href-uk">Посилання кнопки (українська)</Label>
                    <Input
                      id="hero-href-uk"
                      value={homeHeroCtaHrefUk}
                      onChange={(e) => setHomeHeroCtaHrefUk(e.target.value)}
                      placeholder="/help"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="hero-href-en">Посилання кнопки (англійська)</Label>
                    <Input
                      id="hero-href-en"
                      value={homeHeroCtaHrefEn}
                      onChange={(e) => setHomeHeroCtaHrefEn(e.target.value)}
                      placeholder="/help або https://…"
                    />
                  </div>
                </div>
                <Button type="button" disabled={heroSaving} onClick={() => void saveHomeHero()}>
                  {heroSaving ? 'Збереження…' : 'Зберегти банер'}
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="bg-[hsl(var(--card)/0.65)] backdrop-blur md:col-span-2 lg:col-span-3">
          <CardHeader>
            <CardTitle>Блок «Instagram» на головній</CardTitle>
            <CardDescription>
              Сім полів — пряме посилання на зображення для кожної клітини мозаїки (наприклад URL з CDN Instagram).
              Заголовок, опис і кнопка секції — окремо UK/EN. Збережіть блок після змін. Порожнє поле — без фото в цій
              клітині; якщо всі порожні — на сайті стандартне зображення.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
            {loading ? (
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Завантаження…</p>
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {igImageUrls.map((url, index) => (
                    <div key={index} className="grid gap-2">
                      <Label htmlFor={`ig-img-${index}`}>
                        Вікно {index + 1}{' '}
                        <span className="font-normal text-[hsl(var(--muted-foreground))]">
                          ({IG_MOSAIC_HINTS[index]})
                        </span>
                      </Label>
                      <Input
                        id={`ig-img-${index}`}
                        value={url}
                        onChange={(e) => {
                          const v = e.target.value
                          setIgImageUrls((prev) => {
                            const next = [...prev]
                            next[index] = v
                            return next
                          })
                        }}
                        placeholder="https://… (пряме посилання на зображення)"
                        className="font-mono text-xs sm:text-sm"
                      />
                    </div>
                  ))}
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="ig-title-uk">Заголовок (українська)</Label>
                    <Input
                      id="ig-title-uk"
                      value={instagramSectionTitleUk}
                      onChange={(e) => setInstagramSectionTitleUk(e.target.value)}
                      placeholder="Історії, що змінюють життя"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="ig-title-en">Заголовок (англійська)</Label>
                    <Input
                      id="ig-title-en"
                      value={instagramSectionTitleEn}
                      onChange={(e) => setInstagramSectionTitleEn(e.target.value)}
                      placeholder="Stories that change lives"
                    />
                  </div>
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="ig-desc-uk">Опис (українська)</Label>
                    <Textarea
                      id="ig-desc-uk"
                      rows={3}
                      value={instagramSectionDescriptionUk}
                      onChange={(e) => setInstagramSectionDescriptionUk(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="ig-desc-en">Опис (англійська)</Label>
                    <Textarea
                      id="ig-desc-en"
                      rows={3}
                      value={instagramSectionDescriptionEn}
                      onChange={(e) => setInstagramSectionDescriptionEn(e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="ig-cta-uk">Текст кнопки (українська)</Label>
                    <Input
                      id="ig-cta-uk"
                      value={instagramSectionCtaLabelUk}
                      onChange={(e) => setInstagramSectionCtaLabelUk(e.target.value)}
                      placeholder="Стежити за нами"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="ig-cta-en">Текст кнопки (англійська)</Label>
                    <Input
                      id="ig-cta-en"
                      value={instagramSectionCtaLabelEn}
                      onChange={(e) => setInstagramSectionCtaLabelEn(e.target.value)}
                      placeholder="Follow us"
                    />
                  </div>
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="ig-href-uk">Посилання кнопки (українська)</Label>
                    <Input
                      id="ig-href-uk"
                      value={instagramSectionCtaHrefUk}
                      onChange={(e) => setInstagramSectionCtaHrefUk(e.target.value)}
                      placeholder="https://www.instagram.com/riseofukraine"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="ig-href-en">Посилання кнопки (англійська)</Label>
                    <Input
                      id="ig-href-en"
                      value={instagramSectionCtaHrefEn}
                      onChange={(e) => setInstagramSectionCtaHrefEn(e.target.value)}
                      placeholder="https://www.instagram.com/riseofukraine"
                    />
                  </div>
                </div>
                <Button type="button" disabled={instagramSaving} onClick={() => void saveInstagramBlock()}>
                  {instagramSaving ? 'Збереження…' : 'Зберегти блок Instagram'}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
