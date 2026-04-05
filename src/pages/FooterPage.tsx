import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { apiFetch, ApiError } from '@admin/api/http'
import { AdminPersistFooter } from '@admin/components/AdminPersistFooter'
import { Button } from '@admin/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@admin/components/ui/card'
import { Input } from '@admin/components/ui/input'
import { Label } from '@admin/components/ui/label'
import { Textarea } from '@admin/components/ui/textarea'
import { footerHrefFromEnLabel } from '@admin/lib/slug'
import { toastError, toastSuccess } from '@admin/lib/toast'
import { Plus, Save, Trash2 } from 'lucide-react'
import { API_BASE_URL } from '@admin/api/config'

type FooterLink = { href: string; labelUk: string; labelEn: string }
type FooterSocial = { href: string; label: string; icon?: string }

type SiteSettingsPublic = {
  homeLogoUrl: string | null
  footerLocationTitleUk?: string
  footerLocationTitleEn?: string
  footerLocationBodyUk?: string
  footerLocationBodyEn?: string
  footerEdrpouTitleUk?: string
  footerEdrpouTitleEn?: string
  footerEdrpouValue?: string
  footerContactsTitleUk?: string
  footerContactsTitleEn?: string
  footerPartnersLabelUk?: string
  footerPartnersLabelEn?: string
  footerPartnersEmail?: string
  footerMediaLabelUk?: string
  footerMediaLabelEn?: string
  footerMediaEmail?: string
  footerOtherLabelUk?: string
  footerOtherLabelEn?: string
  footerOtherEmail?: string
  footerPhoneLabelUk?: string
  footerPhoneLabelEn?: string
  footerPhoneValue?: string
  footerNavMain?: FooterLink[]
  footerNavLegal?: FooterLink[]
  footerSocials?: FooterSocial[]
  footerRightsUk?: string
  footerRightsEn?: string
}

function safeLinks(input: unknown): FooterLink[] {
  if (!Array.isArray(input)) return []
  return input
    .filter((x) => x && typeof x === 'object' && !Array.isArray(x))
    .map((x) => x as any)
    .map((x) => ({
      href: typeof x.href === 'string' ? x.href : '',
      labelUk: typeof x.labelUk === 'string' ? x.labelUk : '',
      labelEn: typeof x.labelEn === 'string' ? x.labelEn : '',
    }))
}

function safeSocials(input: unknown): FooterSocial[] {
  if (!Array.isArray(input)) return []
  return input
    .filter((x) => x && typeof x === 'object' && !Array.isArray(x))
    .map((x) => x as any)
    .map((x) => ({
      href: typeof x.href === 'string' ? x.href : '',
      label: typeof x.label === 'string' ? x.label : '',
      icon: typeof x.icon === 'string' ? x.icon : '',
    }))
}

/** Той самий об’єкт, що й PATCH body / useMemo patchPayload — для baseline після відповіді сервера. */
function footerSettingsToPatch(s: SiteSettingsPublic) {
  return {
    footerLocationTitleUk: s.footerLocationTitleUk ?? '',
    footerLocationTitleEn: s.footerLocationTitleEn ?? '',
    footerLocationBodyUk: s.footerLocationBodyUk ?? '',
    footerLocationBodyEn: s.footerLocationBodyEn ?? '',
    footerEdrpouTitleUk: s.footerEdrpouTitleUk ?? '',
    footerEdrpouTitleEn: s.footerEdrpouTitleEn ?? '',
    footerEdrpouValue: s.footerEdrpouValue ?? '',
    footerContactsTitleUk: s.footerContactsTitleUk ?? '',
    footerContactsTitleEn: s.footerContactsTitleEn ?? '',
    footerPartnersLabelUk: s.footerPartnersLabelUk ?? '',
    footerPartnersLabelEn: s.footerPartnersLabelEn ?? '',
    footerPartnersEmail: s.footerPartnersEmail ?? '',
    footerMediaLabelUk: s.footerMediaLabelUk ?? '',
    footerMediaLabelEn: s.footerMediaLabelEn ?? '',
    footerMediaEmail: s.footerMediaEmail ?? '',
    footerOtherLabelUk: s.footerOtherLabelUk ?? '',
    footerOtherLabelEn: s.footerOtherLabelEn ?? '',
    footerOtherEmail: s.footerOtherEmail ?? '',
    footerPhoneLabelUk: s.footerPhoneLabelUk ?? '',
    footerPhoneLabelEn: s.footerPhoneLabelEn ?? '',
    footerPhoneValue: s.footerPhoneValue ?? '',
    footerNavMain: safeLinks(s.footerNavMain),
    footerNavLegal: safeLinks(s.footerNavLegal),
    footerSocials: safeSocials(s.footerSocials),
    footerRightsUk: s.footerRightsUk ?? '',
    footerRightsEn: s.footerRightsEn ?? '',
  }
}

export function FooterPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [lang, setLang] = useState<'uk' | 'en'>('uk')

  const t = useCallback((uk: string, en: string) => (lang === 'uk' ? uk : en), [lang])

  const [locationTitleUk, setLocationTitleUk] = useState('')
  const [locationTitleEn, setLocationTitleEn] = useState('')
  const [locationBodyUk, setLocationBodyUk] = useState('')
  const [locationBodyEn, setLocationBodyEn] = useState('')

  const [edrpouTitleUk, setEdrpouTitleUk] = useState('')
  const [edrpouTitleEn, setEdrpouTitleEn] = useState('')
  const [edrpouValue, setEdrpouValue] = useState('')

  const [contactsTitleUk, setContactsTitleUk] = useState('')
  const [contactsTitleEn, setContactsTitleEn] = useState('')

  const [partnersLabelUk, setPartnersLabelUk] = useState('')
  const [partnersLabelEn, setPartnersLabelEn] = useState('')
  const [partnersEmail, setPartnersEmail] = useState('')

  const [mediaLabelUk, setMediaLabelUk] = useState('')
  const [mediaLabelEn, setMediaLabelEn] = useState('')
  const [mediaEmail, setMediaEmail] = useState('')

  const [otherLabelUk, setOtherLabelUk] = useState('')
  const [otherLabelEn, setOtherLabelEn] = useState('')
  const [otherEmail, setOtherEmail] = useState('')

  const [phoneLabelUk, setPhoneLabelUk] = useState('')
  const [phoneLabelEn, setPhoneLabelEn] = useState('')
  const [phoneValue, setPhoneValue] = useState('')

  const [navMain, setNavMain] = useState<FooterLink[]>([])
  const [navLegal, setNavLegal] = useState<FooterLink[]>([])
  const [socials, setSocials] = useState<FooterSocial[]>([])

  const [homeLogoUrl, setHomeLogoUrl] = useState<string | null>(null)
  const [rightsUk, setRightsUk] = useState('')
  const [rightsEn, setRightsEn] = useState('')

  const logoInputRef = useRef<HTMLInputElement | null>(null)

  const applySettingsFromServer = useCallback((s: SiteSettingsPublic) => {
    setHomeLogoUrl(s.homeLogoUrl ?? null)
    setLocationTitleUk(s.footerLocationTitleUk ?? '')
    setLocationTitleEn(s.footerLocationTitleEn ?? '')
    setLocationBodyUk(s.footerLocationBodyUk ?? '')
    setLocationBodyEn(s.footerLocationBodyEn ?? '')
    setEdrpouTitleUk(s.footerEdrpouTitleUk ?? '')
    setEdrpouTitleEn(s.footerEdrpouTitleEn ?? '')
    setEdrpouValue(s.footerEdrpouValue ?? '')
    setContactsTitleUk(s.footerContactsTitleUk ?? '')
    setContactsTitleEn(s.footerContactsTitleEn ?? '')
    setPartnersLabelUk(s.footerPartnersLabelUk ?? '')
    setPartnersLabelEn(s.footerPartnersLabelEn ?? '')
    setPartnersEmail(s.footerPartnersEmail ?? '')
    setMediaLabelUk(s.footerMediaLabelUk ?? '')
    setMediaLabelEn(s.footerMediaLabelEn ?? '')
    setMediaEmail(s.footerMediaEmail ?? '')
    setOtherLabelUk(s.footerOtherLabelUk ?? '')
    setOtherLabelEn(s.footerOtherLabelEn ?? '')
    setOtherEmail(s.footerOtherEmail ?? '')
    setPhoneLabelUk(s.footerPhoneLabelUk ?? '')
    setPhoneLabelEn(s.footerPhoneLabelEn ?? '')
    setPhoneValue(s.footerPhoneValue ?? '')
    setNavMain(safeLinks(s.footerNavMain))
    setNavLegal(safeLinks(s.footerNavLegal))
    setSocials(safeSocials(s.footerSocials))
    setRightsUk(s.footerRightsUk ?? '')
    setRightsEn(s.footerRightsEn ?? '')
  }, [])

  const patchPayload = useMemo(
    () => ({
      footerLocationTitleUk: locationTitleUk,
      footerLocationTitleEn: locationTitleEn,
      footerLocationBodyUk: locationBodyUk,
      footerLocationBodyEn: locationBodyEn,
      footerEdrpouTitleUk: edrpouTitleUk,
      footerEdrpouTitleEn: edrpouTitleEn,
      footerEdrpouValue: edrpouValue,
      footerContactsTitleUk: contactsTitleUk,
      footerContactsTitleEn: contactsTitleEn,
      footerPartnersLabelUk: partnersLabelUk,
      footerPartnersLabelEn: partnersLabelEn,
      footerPartnersEmail: partnersEmail,
      footerMediaLabelUk: mediaLabelUk,
      footerMediaLabelEn: mediaLabelEn,
      footerMediaEmail: mediaEmail,
      footerOtherLabelUk: otherLabelUk,
      footerOtherLabelEn: otherLabelEn,
      footerOtherEmail: otherEmail,
      footerPhoneLabelUk: phoneLabelUk,
      footerPhoneLabelEn: phoneLabelEn,
      footerPhoneValue: phoneValue,
      footerNavMain: navMain,
      footerNavLegal: navLegal,
      footerSocials: socials,
      footerRightsUk: rightsUk,
      footerRightsEn: rightsEn,
    }),
    [
      locationTitleUk,
      locationTitleEn,
      locationBodyUk,
      locationBodyEn,
      edrpouTitleUk,
      edrpouTitleEn,
      edrpouValue,
      contactsTitleUk,
      contactsTitleEn,
      partnersLabelUk,
      partnersLabelEn,
      partnersEmail,
      mediaLabelUk,
      mediaLabelEn,
      mediaEmail,
      otherLabelUk,
      otherLabelEn,
      otherEmail,
      phoneLabelUk,
      phoneLabelEn,
      phoneValue,
      navMain,
      navLegal,
      socials,
      rightsUk,
      rightsEn,
    ],
  )

  const patchPayloadRef = useRef(patchPayload)
  patchPayloadRef.current = patchPayload

  const baselineJsonRef = useRef<string | null>(null)

  const load = useCallback(async () => {
    try {
      const s = await apiFetch<SiteSettingsPublic>('/settings')
      applySettingsFromServer(s)
      baselineJsonRef.current = JSON.stringify(footerSettingsToPatch(s))
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) return
      toastError('Помилка', 'Не вдалося завантажити налаштування футера.')
    } finally {
      setLoading(false)
    }
  }, [applySettingsFromServer])

  useEffect(() => {
    void load()
  }, [load])

  const locationTitle = lang === 'uk' ? locationTitleUk : locationTitleEn
  const locationBody = lang === 'uk' ? locationBodyUk : locationBodyEn
  const edrpouTitle = lang === 'uk' ? edrpouTitleUk : edrpouTitleEn
  const contactsTitle = lang === 'uk' ? contactsTitleUk : contactsTitleEn
  const partnersLabel = lang === 'uk' ? partnersLabelUk : partnersLabelEn
  const mediaLabel = lang === 'uk' ? mediaLabelUk : mediaLabelEn
  const otherLabel = lang === 'uk' ? otherLabelUk : otherLabelEn
  const phoneLabel = lang === 'uk' ? phoneLabelUk : phoneLabelEn
  const rightsText = lang === 'uk' ? rightsUk : rightsEn

  const dirty = useMemo(() => true, [])

  const save = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (opts?.silent) {
        const next = JSON.stringify(patchPayloadRef.current)
        if (next === baselineJsonRef.current) return
      }
      setSaving(true)
      try {
        const s = await apiFetch<SiteSettingsPublic>('/settings', {
          method: 'PATCH',
          json: patchPayloadRef.current,
        })
        if (!opts?.silent) {
          applySettingsFromServer(s)
          baselineJsonRef.current = JSON.stringify(footerSettingsToPatch(s))
          toastSuccess('Збережено', 'Футер оновлено.')
        } else {
          baselineJsonRef.current = JSON.stringify(patchPayloadRef.current)
        }
      } catch {
        toastError('Помилка', opts?.silent ? 'Автозбереження не вдалося.' : 'Не вдалося зберегти футер.')
      } finally {
        setSaving(false)
      }
    },
    [applySettingsFromServer],
  )

  const persistBlur = useCallback(() => void save({ silent: true }), [save])

  const origin = API_BASE_URL.replace(/\/api$/, '')
  const logoPreviewSrc = homeLogoUrl
    ? homeLogoUrl.startsWith('http')
      ? homeLogoUrl
      : `${origin}${homeLogoUrl}`
    : null

  const uploadLogo = useCallback(async (file: File | null) => {
    if (!file) return
    setUploadingLogo(true)
    try {
      const form = new FormData()
      form.append('image', file)
      const updated = await apiFetch<SiteSettingsPublic>('/settings/home-logo', {
        method: 'POST',
        body: form,
      })
      applySettingsFromServer(updated)
      toastSuccess('Завантажено', 'Логотип оновлено.')
    } catch {
      toastError('Помилка', 'Не вдалося завантажити логотип.')
    } finally {
      setUploadingLogo(false)
      if (logoInputRef.current) logoInputRef.current.value = ''
    }
  }, [applySettingsFromServer])

  const SOCIAL_ICON_OPTIONS = useMemo(
    () => [
      { value: 'facebook', label: 'Facebook' },
      { value: 'linkedin', label: 'LinkedIn' },
      { value: 'youtube', label: 'YouTube' },
      { value: 'instagram', label: 'Instagram' },
    ],
    [],
  )

  const loadingRef = useRef(loading)
  loadingRef.current = loading

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (loadingRef.current) return
      const next = JSON.stringify(patchPayloadRef.current)
      if (next === baselineJsonRef.current) return
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [])

  useEffect(() => {
    if (loading) return
    const next = JSON.stringify(patchPayload)
    if (baselineJsonRef.current === null) {
      baselineJsonRef.current = next
      return
    }
    if (next === baselineJsonRef.current) return
    const t = window.setTimeout(() => void save({ silent: true }), 400)
    return () => window.clearTimeout(t)
  }, [patchPayload, loading, save])

  return (
    <div className={`space-y-6 ${loading ? '' : 'pb-28'}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[hsl(var(--foreground))]">Футер</h1>
          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">{t('Повні налаштування футера (UA/EN).', 'Full footer settings (UA/EN).')}</p>
        </div>
        <div className="flex gap-2">
          <Button type="button" size="sm" variant={lang === 'uk' ? 'default' : 'secondary'} onClick={() => setLang('uk')}>
            UA
          </Button>
          <Button type="button" size="sm" variant={lang === 'en' ? 'default' : 'secondary'} onClick={() => setLang('en')}>
            EN
          </Button>
          {dirty ? (
            <Button type="button" size="sm" disabled={saving} onClick={() => void save()}>
              <Save className="size-4" aria-hidden />
              {saving ? t('Збереження…', 'Saving…') : t('Зберегти', 'Save')}
            </Button>
          ) : null}
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-[hsl(var(--muted-foreground))]">{t('Завантаження…', 'Loading…')}</div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="bg-[hsl(var(--card)/0.65)] backdrop-blur lg:col-span-2">
            <CardHeader>
              <CardTitle>{t('Логотип + копірайт', 'Logo + copyright')}</CardTitle>
              <CardDescription>
                {t('Логотип (upload) та текст копірайта внизу футера (UA/EN).', 'Logo (upload) and footer copyright text (UA/EN).')}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label>{t('Поточний логотип', 'Current logo')}</Label>
                <div className="flex min-h-[72px] items-center justify-center rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card)/0.5)] p-4">
                  {logoPreviewSrc ? (
                    <img src={logoPreviewSrc} alt="" className="max-h-14 max-w-[220px] object-contain" loading="lazy" />
                  ) : (
                    <span className="text-sm text-[hsl(var(--muted-foreground))]">{t('Ще не завантажено', 'Not uploaded yet')}</span>
                  )}
                </div>
              </div>

              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploadingLogo}
                onChange={(e) => void uploadLogo(e.target.files?.[0] ?? null)}
              />
              <div className="flex items-center gap-3">
                <Button type="button" variant="secondary" size="sm" disabled={uploadingLogo} onClick={() => logoInputRef.current?.click()}>
                  {uploadingLogo ? t('Завантаження…', 'Uploading…') : t('Вибрати файл', 'Choose file')}
                </Button>
                <div className="text-xs text-[hsl(var(--muted-foreground))]">
                  {t('PNG/JPG/SVG до 5 МБ', 'PNG/JPG/SVG up to 5 MB')}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Rights (UA)</Label>
                  <Input onBlur={persistBlur} value={rightsUk} onChange={(e) => setRightsUk(e.target.value)} placeholder="© {year}. Всі права захищені" />
                </div>
                <div className="grid gap-2">
                  <Label>Rights (EN)</Label>
                  <Input onBlur={persistBlur} value={rightsEn} onChange={(e) => setRightsEn(e.target.value)} placeholder="© {year}. All rights reserved" />
                </div>
              </div>

              <div className="grid gap-2">
                <Label>{t('Preview (selected language)', 'Preview (selected language)')}</Label>
                <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card)/0.4)] p-4 text-sm text-[hsl(var(--muted-foreground))]">
                  <div className="text-[hsl(var(--foreground))]">{rightsText || '—'}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[hsl(var(--card)/0.65)] backdrop-blur">
            <CardHeader>
              <CardTitle>{t('Локація / ЄДРПОУ', 'Location / Company ID')}</CardTitle>
              <CardDescription>{t('Заголовки та значення.', 'Titles and values.')}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label>{t('Заголовок локації', 'Location title')}</Label>
                <Input onBlur={persistBlur} value={locationTitle} onChange={(e) => (lang === 'uk' ? setLocationTitleUk(e.target.value) : setLocationTitleEn(e.target.value))} />
              </div>
              <div className="grid gap-2">
                <Label>{t('Текст локації', 'Location text')}</Label>
                <Textarea onBlur={persistBlur} value={locationBody} onChange={(e) => (lang === 'uk' ? setLocationBodyUk(e.target.value) : setLocationBodyEn(e.target.value))} />
              </div>
              <div className="grid gap-2">
                <Label>{t('Заголовок ЄДРПОУ', 'Company ID title')}</Label>
                <Input onBlur={persistBlur} value={edrpouTitle} onChange={(e) => (lang === 'uk' ? setEdrpouTitleUk(e.target.value) : setEdrpouTitleEn(e.target.value))} />
              </div>
              <div className="grid gap-2">
                <Label>{t('ЄДРПОУ (значення)', 'Company ID (value)')}</Label>
                <Input onBlur={persistBlur} value={edrpouValue} onChange={(e) => setEdrpouValue(e.target.value)} />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[hsl(var(--card)/0.65)] backdrop-blur">
            <CardHeader>
              <CardTitle>{t('Контакти', 'Contacts')}</CardTitle>
              <CardDescription>{t('Лейбли (UA/EN) + email/phone.', 'Labels (UA/EN) + email/phone.')}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label>{t('Заголовок', 'Title')}</Label>
                <Input onBlur={persistBlur} value={contactsTitle} onChange={(e) => (lang === 'uk' ? setContactsTitleUk(e.target.value) : setContactsTitleEn(e.target.value))} />
              </div>

              <div className="grid gap-2">
                <Label>{t('Лейбл “Партнерам”', 'Label “Partners”')}</Label>
                <Input onBlur={persistBlur} value={partnersLabel} onChange={(e) => (lang === 'uk' ? setPartnersLabelUk(e.target.value) : setPartnersLabelEn(e.target.value))} />
              </div>
              <div className="grid gap-2">
                <Label>{t('Email партнерів', 'Partners email')}</Label>
                <Input onBlur={persistBlur} value={partnersEmail} onChange={(e) => setPartnersEmail(e.target.value)} placeholder="partners@riseofukraine.com" />
              </div>

              <div className="grid gap-2">
                <Label>{t('Лейбл “Комунікації”', 'Label “Media”')}</Label>
                <Input onBlur={persistBlur} value={mediaLabel} onChange={(e) => (lang === 'uk' ? setMediaLabelUk(e.target.value) : setMediaLabelEn(e.target.value))} />
              </div>
              <div className="grid gap-2">
                <Label>{t('Email медіа', 'Media email')}</Label>
                <Input onBlur={persistBlur} value={mediaEmail} onChange={(e) => setMediaEmail(e.target.value)} placeholder="media@riseofukraine.com" />
              </div>

              <div className="grid gap-2">
                <Label>{t('Лейбл “З інших питань”', 'Label “Other”')}</Label>
                <Input onBlur={persistBlur} value={otherLabel} onChange={(e) => (lang === 'uk' ? setOtherLabelUk(e.target.value) : setOtherLabelEn(e.target.value))} />
              </div>
              <div className="grid gap-2">
                <Label>{t('Email загальний', 'General email')}</Label>
                <Input onBlur={persistBlur} value={otherEmail} onChange={(e) => setOtherEmail(e.target.value)} placeholder="info@riseofukraine.com" />
              </div>

              <div className="grid gap-2">
                <Label>{t('Лейбл “Телефон”', 'Label “Phone”')}</Label>
                <Input onBlur={persistBlur} value={phoneLabel} onChange={(e) => (lang === 'uk' ? setPhoneLabelUk(e.target.value) : setPhoneLabelEn(e.target.value))} />
              </div>
              <div className="grid gap-2">
                <Label>{t('Телефон (значення)', 'Phone (value)')}</Label>
                <Input onBlur={persistBlur} value={phoneValue} onChange={(e) => setPhoneValue(e.target.value)} placeholder="+38 (095) 478 99 96" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[hsl(var(--card)/0.65)] backdrop-blur">
            <CardHeader>
              <CardTitle>Навігація (основна)</CardTitle>
              <CardDescription>
                Href з Label (EN) як /slug. Текст зберігається, коли ти переходиш до іншого поля (клік поза полем) або натискаєш «Зберегти»; не закривай вкладку одразу після набору.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {navMain.map((x, idx) => (
                <div key={idx} className="grid gap-2 rounded-lg border border-[hsl(var(--border))] p-3">
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <Label>Href</Label>
                      <Input onBlur={persistBlur} value={x.href} onChange={(e) => setNavMain((p) => p.map((it, i) => (i === idx ? { ...it, href: e.target.value } : it)))} />
                    </div>
                    <div className="flex items-end justify-end">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="text-red-600 hover:bg-red-500/10 hover:text-red-700"
                        onClick={() => {
                          flushSync(() => setNavMain((p) => p.filter((_, i) => i !== idx)))
                          void save({ silent: true })
                        }}
                      >
                        <Trash2 className="size-4" aria-hidden />
                        <span className="sr-only">Видалити</span>
                      </Button>
                    </div>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <Label>Label (UA)</Label>
                      <Input onBlur={persistBlur} value={x.labelUk} onChange={(e) => setNavMain((p) => p.map((it, i) => (i === idx ? { ...it, labelUk: e.target.value } : it)))} />
                    </div>
                    <div className="grid gap-2">
                      <Label>Label (EN)</Label>
                      <Input
                        onBlur={persistBlur}
                        value={x.labelEn}
                        onChange={(e) => {
                          const labelEn = e.target.value
                          setNavMain((p) =>
                            p.map((it, i) => (i === idx ? { ...it, labelEn, href: footerHrefFromEnLabel(labelEn) } : it)),
                          )
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => {
                  flushSync(() => setNavMain((p) => [...p, { href: '', labelUk: '', labelEn: '' }]))
                  void save({ silent: true })
                }}
              >
                <Plus className="size-4" aria-hidden />
                <span className="sr-only">Додати</span>
                Додати
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-[hsl(var(--card)/0.65)] backdrop-blur">
            <CardHeader>
              <CardTitle>Навігація (legal)</CardTitle>
              <CardDescription>
                Href з Label (EN) як /slug. Текст зберігається, коли ти переходиш до іншого поля (клік поза полем) або натискаєш «Зберегти»; не закривай вкладку одразу після набору.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {navLegal.map((x, idx) => (
                <div key={idx} className="grid gap-2 rounded-lg border border-[hsl(var(--border))] p-3">
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <Label>Href</Label>
                      <Input onBlur={persistBlur} value={x.href} onChange={(e) => setNavLegal((p) => p.map((it, i) => (i === idx ? { ...it, href: e.target.value } : it)))} />
                    </div>
                    <div className="flex items-end justify-end">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="text-red-600 hover:bg-red-500/10 hover:text-red-700"
                        onClick={() => {
                          flushSync(() => setNavLegal((p) => p.filter((_, i) => i !== idx)))
                          void save({ silent: true })
                        }}
                      >
                        <Trash2 className="size-4" aria-hidden />
                        <span className="sr-only">Видалити</span>
                      </Button>
                    </div>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <Label>Label (UA)</Label>
                      <Input onBlur={persistBlur} value={x.labelUk} onChange={(e) => setNavLegal((p) => p.map((it, i) => (i === idx ? { ...it, labelUk: e.target.value } : it)))} />
                    </div>
                    <div className="grid gap-2">
                      <Label>Label (EN)</Label>
                      <Input
                        onBlur={persistBlur}
                        value={x.labelEn}
                        onChange={(e) => {
                          const labelEn = e.target.value
                          setNavLegal((p) =>
                            p.map((it, i) => (i === idx ? { ...it, labelEn, href: footerHrefFromEnLabel(labelEn) } : it)),
                          )
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => {
                  flushSync(() => setNavLegal((p) => [...p, { href: '', labelUk: '', labelEn: '' }]))
                  void save({ silent: true })
                }}
              >
                <Plus className="size-4" aria-hidden />
                <span className="sr-only">Додати</span>
                Додати
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-[hsl(var(--card)/0.65)] backdrop-blur lg:col-span-2">
            <CardHeader>
              <CardTitle>Соцмережі</CardTitle>
              <CardDescription>Кнопки соцмереж (href + label).</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-3">
                {socials.map((x, idx) => (
                  <div key={idx} className="grid gap-2 rounded-lg border border-[hsl(var(--border))] p-3 sm:grid-cols-[1fr_220px_auto] sm:items-end">
                    <div className="grid gap-2">
                      <Label>Href</Label>
                      <Input onBlur={persistBlur} value={x.href} onChange={(e) => setSocials((p) => p.map((it, i) => (i === idx ? { ...it, href: e.target.value } : it)))} />
                    </div>
                    <div className="grid gap-2">
                      <Label>{t('Іконка', 'Icon')}</Label>
                      <select
                        className="flex h-10 w-full rounded-md border border-[hsl(var(--border))] bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
                        value={x.icon || ''}
                        onChange={(e) => {
                          const icon = e.target.value
                          setSocials((p) =>
                            p.map((it, i) =>
                              i === idx
                                ? {
                                    ...it,
                                    icon,
                                    label: (it.label || '').trim() ? it.label : (SOCIAL_ICON_OPTIONS.find((o) => o.value === icon)?.label ?? ''),
                                  }
                                : it,
                            ),
                          )
                        }}
                        onBlur={persistBlur}
                      >
                        <option value="">{t('— вибери —', '— select —')}</option>
                        {SOCIAL_ICON_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="text-red-600 hover:bg-red-500/10 hover:text-red-700"
                      onClick={() => {
                        flushSync(() => setSocials((p) => p.filter((_, i) => i !== idx)))
                        void save({ silent: true })
                      }}
                    >
                      <Trash2 className="size-4" aria-hidden />
                      <span className="sr-only">Видалити</span>
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    flushSync(() => setSocials((p) => [...p, { href: '', label: '', icon: '' }]))
                    void save({ silent: true })
                  }}
                >
                  <Plus className="size-4" aria-hidden />
                  <span className="sr-only">Додати</span>
                  Додати
                </Button>
              </div>

              <div className="grid gap-2">
                <Label>Preview (selected language)</Label>
                <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card)/0.4)] p-4 text-sm text-[hsl(var(--muted-foreground))]">
                  <div className="font-semibold text-[hsl(var(--foreground))]">{locationTitle || '—'}</div>
                  <div className="mt-1 whitespace-pre-wrap">{locationBody || '—'}</div>
                  <div className="mt-2">
                    <span className="font-medium text-[hsl(var(--foreground))]">{edrpouTitle || '—'}:</span>{' '}
                    {edrpouValue || '—'}
                  </div>

                  <div className="mt-3 font-semibold text-[hsl(var(--foreground))]">{contactsTitle || '—'}</div>
                  <div className="mt-1">{partnersLabel || '—'} {partnersEmail || '—'}</div>
                  <div>{mediaLabel || '—'} {mediaEmail || '—'}</div>
                  <div>{otherLabel || '—'} {otherEmail || '—'}</div>
                  <div>{phoneLabel || '—'} {phoneValue || '—'}</div>

                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div>
                      <div className="font-semibold text-[hsl(var(--foreground))]">{t('Навігація (основна)', 'Navigation (main)')}</div>
                      <ul className="mt-1 list-disc space-y-1 pl-5">
                        {navMain.length ? (
                          navMain.map((x, i) => (
                            <li key={`nav-main-${i}`}>
                              {(lang === 'uk' ? x.labelUk : x.labelEn) || '—'}{' '}
                              <span className="text-[hsl(var(--muted-foreground))]">({x.href || '—'})</span>
                            </li>
                          ))
                        ) : (
                          <li>—</li>
                        )}
                      </ul>
                    </div>
                    <div>
                      <div className="font-semibold text-[hsl(var(--foreground))]">{t('Навігація (legal)', 'Navigation (legal)')}</div>
                      <ul className="mt-1 list-disc space-y-1 pl-5">
                        {navLegal.length ? (
                          navLegal.map((x, i) => (
                            <li key={`nav-legal-${i}`}>
                              {(lang === 'uk' ? x.labelUk : x.labelEn) || '—'}{' '}
                              <span className="text-[hsl(var(--muted-foreground))]">({x.href || '—'})</span>
                            </li>
                          ))
                        ) : (
                          <li>—</li>
                        )}
                      </ul>
                    </div>
                  </div>

                  <div className="mt-3">
                    <div className="font-semibold text-[hsl(var(--foreground))]">{t('Соцмережі', 'Socials')}</div>
                    <ul className="mt-1 list-disc space-y-1 pl-5">
                      {socials.length ? (
                        socials.map((x, i) => (
                          <li key={`social-${i}`}>
                            {x.label || '—'}{' '}
                            <span className="text-[hsl(var(--muted-foreground))]">({x.href || '—'})</span>
                          </li>
                        ))
                      ) : (
                        <li>—</li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {!loading ? <AdminPersistFooter saving={saving} onSave={() => void save()} disabled={saving} /> : null}
    </div>
  )
}

