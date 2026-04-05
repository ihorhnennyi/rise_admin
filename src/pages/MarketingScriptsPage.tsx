import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { apiFetch, ApiError } from '@admin/api/http'
import { AdminPersistFooter } from '@admin/components/AdminPersistFooter'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@admin/components/ui/card'
import { Input } from '@admin/components/ui/input'
import { Label } from '@admin/components/ui/label'
import { Textarea } from '@admin/components/ui/textarea'
import { toastError, toastSuccess } from '@admin/lib/toast'
import { LineChart } from 'lucide-react'

type MarketingSlice = {
  marketingGa4MeasurementId: string
  marketingGtmContainerId: string
  marketingFacebookPixelId: string
  marketingCustomHeadHtml: string
  marketingCustomBodyHtml: string
}

function sliceFromSettings(data: Record<string, unknown>): MarketingSlice {
  return {
    marketingGa4MeasurementId: typeof data.marketingGa4MeasurementId === 'string' ? data.marketingGa4MeasurementId : '',
    marketingGtmContainerId: typeof data.marketingGtmContainerId === 'string' ? data.marketingGtmContainerId : '',
    marketingFacebookPixelId: typeof data.marketingFacebookPixelId === 'string' ? data.marketingFacebookPixelId : '',
    marketingCustomHeadHtml: typeof data.marketingCustomHeadHtml === 'string' ? data.marketingCustomHeadHtml : '',
    marketingCustomBodyHtml: typeof data.marketingCustomBodyHtml === 'string' ? data.marketingCustomBodyHtml : '',
  }
}

function marketingPayload(s: MarketingSlice): MarketingSlice {
  return {
    marketingGa4MeasurementId: s.marketingGa4MeasurementId.trim(),
    marketingGtmContainerId: s.marketingGtmContainerId.trim(),
    marketingFacebookPixelId: s.marketingFacebookPixelId.trim(),
    marketingCustomHeadHtml: s.marketingCustomHeadHtml,
    marketingCustomBodyHtml: s.marketingCustomBodyHtml,
  }
}

export function MarketingScriptsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [ga4, setGa4] = useState('')
  const [gtm, setGtm] = useState('')
  const [fb, setFb] = useState('')
  const [headHtml, setHeadHtml] = useState('')
  const [bodyHtml, setBodyHtml] = useState('')
  const initialRef = useRef<string>('')

  const currentSlice = useMemo(
    () =>
      marketingPayload({
        marketingGa4MeasurementId: ga4,
        marketingGtmContainerId: gtm,
        marketingFacebookPixelId: fb,
        marketingCustomHeadHtml: headHtml,
        marketingCustomBodyHtml: bodyHtml,
      }),
    [ga4, gtm, fb, headHtml, bodyHtml],
  )

  const dirty = initialRef.current !== JSON.stringify(currentSlice)

  const applySlice = useCallback((s: MarketingSlice) => {
    const m = marketingPayload(s)
    setGa4(m.marketingGa4MeasurementId)
    setGtm(m.marketingGtmContainerId)
    setFb(m.marketingFacebookPixelId)
    setHeadHtml(m.marketingCustomHeadHtml)
    setBodyHtml(m.marketingCustomBodyHtml)
    initialRef.current = JSON.stringify(m)
  }, [])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const data = await apiFetch<Record<string, unknown>>('/settings')
        if (!cancelled) applySlice(sliceFromSettings(data))
      } catch {
        if (!cancelled) applySlice(sliceFromSettings({}))
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [applySlice])

  async function onSave() {
    setSaving(true)
    try {
      const saved = await apiFetch<MarketingSlice>('/settings/marketing-scripts', {
        method: 'PATCH',
        json: currentSlice,
      })
      applySlice(saved)
      toastSuccess('Збережено')
    } catch (e) {
      if (e instanceof ApiError) {
        const d = e.data as { message?: string | string[] } | null
        const msg = Array.isArray(d?.message) ? d.message.join(', ') : d?.message
        toastError(msg ?? e.message)
      } else {
        toastError('Не вдалося зберегти')
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={loading ? '' : 'pb-28'}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[hsl(var(--muted))] text-[hsl(var(--foreground))]">
          <LineChart className="h-5 w-5" aria-hidden />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[hsl(var(--foreground))]">Скрипти та аналітика</h1>
          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
            Підключення GA4, Google Tag Manager, Meta Pixel та довільного HTML. Ідентифікатори застосовуються на публічному сайті після
            збереження.
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card className="bg-[hsl(var(--card)/0.65)] backdrop-blur">
          <CardHeader>
            <CardTitle>Google Analytics 4</CardTitle>
            <CardDescription>Measurement ID з кабінету GA4 (формат G-XXXXXXXXXX).</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            <Label htmlFor="mkt-ga4">Measurement ID</Label>
            <Input
              id="mkt-ga4"
              placeholder="G-XXXXXXXXXX"
              value={ga4}
              onChange={(e) => setGa4(e.target.value)}
              disabled={loading}
              autoComplete="off"
            />
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              Якщо вже використовуєте GTM для GA4, залиште це поле порожнім, щоб уникнути подвійних хітів.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-[hsl(var(--card)/0.65)] backdrop-blur">
          <CardHeader>
            <CardTitle>Google Tag Manager</CardTitle>
            <CardDescription>ID контейнера (формат GTM-XXXXXXX).</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            <Label htmlFor="mkt-gtm">Container ID</Label>
            <Input
              id="mkt-gtm"
              placeholder="GTM-XXXXXXX"
              value={gtm}
              onChange={(e) => setGtm(e.target.value)}
              disabled={loading}
              autoComplete="off"
            />
          </CardContent>
        </Card>

        <Card className="bg-[hsl(var(--card)/0.65)] backdrop-blur lg:col-span-2">
          <CardHeader>
            <CardTitle>Meta (Facebook) Pixel</CardTitle>
            <CardDescription>Числовий ID пікселя з Events Manager.</CardDescription>
          </CardHeader>
          <CardContent className="grid max-w-md gap-2">
            <Label htmlFor="mkt-fb">Pixel ID</Label>
            <Input
              id="mkt-fb"
              placeholder="1234567890123456"
              inputMode="numeric"
              value={fb}
              onChange={(e) => setFb(e.target.value.replace(/\D/g, ''))}
              disabled={loading}
              autoComplete="off"
            />
          </CardContent>
        </Card>

        <Card className="bg-[hsl(var(--card)/0.65)] backdrop-blur lg:col-span-2">
          <CardHeader>
            <CardTitle>Довільний HTML</CardTitle>
            <CardDescription>
              Додаткові теги на кшталт інших пікселів або верифікацій. Скрипти на кшталт &lt;script&gt; виконуються лише для кореневих тегів у
              фрагменті; вкладені скрипти можуть не спрацювати.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className="grid gap-2">
              <Label htmlFor="mkt-head">У кінець &lt;head&gt;</Label>
              <Textarea
                id="mkt-head"
                className="min-h-[140px] font-mono text-sm"
                value={headHtml}
                onChange={(e) => setHeadHtml(e.target.value)}
                disabled={loading}
                spellCheck={false}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="mkt-body">Одразу після відкриття &lt;body&gt;</Label>
              <Textarea
                id="mkt-body"
                className="min-h-[140px] font-mono text-sm"
                value={bodyHtml}
                onChange={(e) => setBodyHtml(e.target.value)}
                disabled={loading}
                spellCheck={false}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <AdminPersistFooter
        saving={saving}
        onSave={() => void onSave()}
        disabled={loading || saving || !dirty}
        message="Збережіть зміни перед виходом. GA4 / GTM / Pixel перевіряються за форматом; порожні поля вимикають відповідний тег на сайті."
      />
    </div>
  )
}
