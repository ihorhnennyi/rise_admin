import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { apiFetch, ApiError } from '@admin/api/http'
import type { SupportBankBlock, SupportPageConfig, SupportPaymentMethod } from '@admin/types/support'
import { API_BASE_URL } from '@admin/api/config'
import { Button } from '@admin/components/ui/button'
import { Input } from '@admin/components/ui/input'
import { Label } from '@admin/components/ui/label'
import { toastError, toastInfo, toastSuccess } from '@admin/lib/toast'
import { AdminPersistFooter } from '@admin/components/AdminPersistFooter'
import { AdminSectionShell } from '@admin/components/AdminSectionShell'
import { HeartHandshake, ImageUp, Landmark, LayoutGrid, Sparkles, Trash2 } from 'lucide-react'

type UiPm = SupportPaymentMethod & { _key: string }
type UiBank = SupportBankBlock & { _key: string }

function withKeysPm(list: SupportPaymentMethod[]): UiPm[] {
  return list.map((x) => ({ ...x, wide: x.wide === true, _key: crypto.randomUUID() }))
}

function withKeysBank(list: SupportBankBlock[]): UiBank[] {
  return list.map((x) => ({ ...x, _key: crypto.randomUUID() }))
}

function stripPm(list: UiPm[]): SupportPaymentMethod[] {
  return list.map(({ _key: _k, ...r }) => ({ ...r, wide: r.wide === true }))
}

function stripBank(list: UiBank[]): SupportBankBlock[] {
  return list.map(({ _key: _k, ...r }) => r)
}

function parsePresetAmounts(raw: string): number[] {
  return raw
    .split(/[\s,;]+/)
    .map((x) => Number(x.trim()))
    .filter((n) => Number.isFinite(n) && n > 0)
}

/** Стабільний JSON для порівняння «є зміни / ні» (без локальних _key). */
function configSignature(c: SupportPageConfig): string {
  return JSON.stringify({
    heroTitleUk: c.heroTitleUk,
    heroTitleEn: c.heroTitleEn,
    quickDonateLabelUk: c.quickDonateLabelUk,
    quickDonateLabelEn: c.quickDonateLabelEn,
    paymentMethods: (c.paymentMethods ?? []).map((p) => ({
      titleUk: p.titleUk,
      titleEn: p.titleEn,
      anchorId: p.anchorId,
      wide: !!p.wide,
    })),
    formSectionTitleUk: c.formSectionTitleUk,
    formSectionTitleEn: c.formSectionTitleEn,
    presetAmounts: c.presetAmounts ?? [],
    qrCaptionUk: c.qrCaptionUk,
    qrCaptionEn: c.qrCaptionEn,
    qrImageUrl: c.qrImageUrl ?? null,
    bankSectionTitleUk: c.bankSectionTitleUk,
    bankSectionTitleEn: c.bankSectionTitleEn,
    bankBlocks: (c.bankBlocks ?? []).map((b) => ({
      titleUk: b.titleUk,
      titleEn: b.titleEn,
      organizationName: b.organizationName,
      edrpou: b.edrpou,
      iban: b.iban,
    })),
    termsCheckboxUk: c.termsCheckboxUk,
    termsCheckboxEn: c.termsCheckboxEn,
    donateButtonLabelUk: c.donateButtonLabelUk,
    donateButtonLabelEn: c.donateButtonLabelEn,
  })
}

function assetUrl(path: string | null) {
  if (!path) return ''
  const origin = API_BASE_URL.replace(/\/api$/, '')
  return `${origin}${path}`
}

const SUPPORT_SECTION_STORAGE_KEYS = {
  hero: 'rise-admin:support:section:hero',
  paymentMethods: 'rise-admin:support:section:payment-methods',
  formQr: 'rise-admin:support:section:form-qr',
  bank: 'rise-admin:support:section:bank',
} as const

export function SupportPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingQr, setUploadingQr] = useState(false)

  const [heroTitleUk, setHeroTitleUk] = useState('')
  const [heroTitleEn, setHeroTitleEn] = useState('')
  const [quickDonateLabelUk, setQuickDonateLabelUk] = useState('')
  const [quickDonateLabelEn, setQuickDonateLabelEn] = useState('')
  const [paymentMethods, setPaymentMethods] = useState<UiPm[]>([])
  const [formSectionTitleUk, setFormSectionTitleUk] = useState('')
  const [formSectionTitleEn, setFormSectionTitleEn] = useState('')
  const [presetAmountsStr, setPresetAmountsStr] = useState('')
  const [qrCaptionUk, setQrCaptionUk] = useState('')
  const [qrCaptionEn, setQrCaptionEn] = useState('')
  const [qrImageUrl, setQrImageUrl] = useState<string | null>(null)
  const [bankSectionTitleUk, setBankSectionTitleUk] = useState('')
  const [bankSectionTitleEn, setBankSectionTitleEn] = useState('')
  const [bankBlocks, setBankBlocks] = useState<UiBank[]>([])
  const [termsCheckboxUk, setTermsCheckboxUk] = useState('')
  const [termsCheckboxEn, setTermsCheckboxEn] = useState('')
  const [donateButtonLabelUk, setDonateButtonLabelUk] = useState('')
  const [donateButtonLabelEn, setDonateButtonLabelEn] = useState('')

  const initialRef = useRef<string>('')

  const applyConfig = useCallback((c: SupportPageConfig) => {
    setHeroTitleUk(c.heroTitleUk)
    setHeroTitleEn(c.heroTitleEn)
    setQuickDonateLabelUk(c.quickDonateLabelUk)
    setQuickDonateLabelEn(c.quickDonateLabelEn)
    setPaymentMethods(withKeysPm(c.paymentMethods ?? []))
    setFormSectionTitleUk(c.formSectionTitleUk)
    setFormSectionTitleEn(c.formSectionTitleEn)
    setPresetAmountsStr((c.presetAmounts ?? []).join(', '))
    setQrCaptionUk(c.qrCaptionUk)
    setQrCaptionEn(c.qrCaptionEn)
    setQrImageUrl(c.qrImageUrl ?? null)
    setBankSectionTitleUk(c.bankSectionTitleUk)
    setBankSectionTitleEn(c.bankSectionTitleEn)
    setBankBlocks(withKeysBank(c.bankBlocks ?? []))
    setTermsCheckboxUk(c.termsCheckboxUk)
    setTermsCheckboxEn(c.termsCheckboxEn)
    setDonateButtonLabelUk(c.donateButtonLabelUk)
    setDonateButtonLabelEn(c.donateButtonLabelEn)
  }, [])

  const buildPayload = useCallback((): SupportPageConfig => {
    const amounts = parsePresetAmounts(presetAmountsStr)
    return {
      heroTitleUk,
      heroTitleEn,
      quickDonateLabelUk,
      quickDonateLabelEn,
      paymentMethods: stripPm(paymentMethods),
      formSectionTitleUk,
      formSectionTitleEn,
      presetAmounts: amounts.length > 0 ? amounts : [150, 300, 500],
      qrCaptionUk,
      qrCaptionEn,
      qrImageUrl,
      bankSectionTitleUk,
      bankSectionTitleEn,
      bankBlocks: stripBank(bankBlocks),
      termsCheckboxUk,
      termsCheckboxEn,
      donateButtonLabelUk,
      donateButtonLabelEn,
    }
  }, [
    heroTitleUk,
    heroTitleEn,
    quickDonateLabelUk,
    quickDonateLabelEn,
    paymentMethods,
    formSectionTitleUk,
    formSectionTitleEn,
    presetAmountsStr,
    qrCaptionUk,
    qrCaptionEn,
    qrImageUrl,
    bankSectionTitleUk,
    bankSectionTitleEn,
    bankBlocks,
    termsCheckboxUk,
    termsCheckboxEn,
    donateButtonLabelUk,
    donateButtonLabelEn,
  ])

  const patchJson = useMemo(() => configSignature(buildPayload()), [buildPayload])
  const dirty = patchJson !== initialRef.current

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const c = await apiFetch<SupportPageConfig>('/support')
      applyConfig(c)
      initialRef.current = configSignature(c)
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) return
      toastError('Помилка', 'Не вдалося завантажити налаштування сторінки «Підтримати».')
    } finally {
      setLoading(false)
    }
  }, [applyConfig])

  useEffect(() => {
    void load()
  }, [load])

  async function save() {
    setSaving(true)
    try {
      const updated = await apiFetch<SupportPageConfig>('/support', {
        method: 'PATCH',
        json: buildPayload(),
      })
      applyConfig(updated)
      initialRef.current = configSignature(updated)
      toastSuccess('Збережено', 'Сторінка «Підтримати» оновлена.')
    } catch {
      toastError('Помилка', 'Не вдалося зберегти.')
    } finally {
      setSaving(false)
    }
  }

  async function onQrUpload(file: File | null) {
    if (!file) return
    setUploadingQr(true)
    try {
      toastInfo('Завантаження…', 'QR-код')
      const form = new FormData()
      form.append('image', file)
      const updated = await apiFetch<SupportPageConfig>('/support/qr', { method: 'POST', body: form })
      applyConfig(updated)
      initialRef.current = configSignature(updated)
      toastSuccess('Готово', 'QR-код оновлено.')
    } catch {
      toastError('Помилка', 'Не вдалося завантажити QR.')
    } finally {
      setUploadingQr(false)
    }
  }

  async function onQrRemove() {
    try {
      const updated = await apiFetch<SupportPageConfig>('/support/qr', { method: 'DELETE' })
      applyConfig(updated)
      initialRef.current = configSignature(updated)
      toastSuccess('Видалено', 'QR-код прибрано.')
    } catch {
      toastError('Помилка', 'Не вдалося видалити QR.')
    }
  }

  function movePm(i: number, dir: -1 | 1) {
    const j = i + dir
    if (j < 0 || j >= paymentMethods.length) return
    setPaymentMethods((prev) => {
      const next = [...prev]
      ;[next[i], next[j]] = [next[j], next[i]]
      return next
    })
  }

  function moveBank(i: number, dir: -1 | 1) {
    const j = i + dir
    if (j < 0 || j >= bankBlocks.length) return
    setBankBlocks((prev) => {
      const next = [...prev]
      ;[next[i], next[j]] = [next[j], next[i]]
      return next
    })
  }

  if (loading) {
    return <div className="text-sm text-[hsl(var(--muted-foreground))]">Завантаження…</div>
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-28">
      <div className="border-b border-[hsl(var(--border))] pb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-[hsl(var(--foreground))]">Підтримати</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">
          Контент публічної сторінки донату: герой, способи оплати (якорі), форма з сумами, QR та банківські реквізити.
          Поля з мітками (UA) та (EN) — для двох мов сайту. Натисніть «Зберегти» внизу.
        </p>
      </div>

      <div className="grid gap-5">
        <AdminSectionShell
          icon={Sparkles}
          title="Герой і швидкий донат"
          description="Заголовок сторінки та підпис кнопки «Швидкий донат», яка скролить до форми."
          storageKey={SUPPORT_SECTION_STORAGE_KEYS.hero}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Заголовок (UA)</Label>
              <Input value={heroTitleUk} onChange={(e) => setHeroTitleUk(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Заголовок (EN)</Label>
              <Input value={heroTitleEn} onChange={(e) => setHeroTitleEn(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Кнопка «Швидкий донат» (UA)</Label>
              <Input value={quickDonateLabelUk} onChange={(e) => setQuickDonateLabelUk(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Кнопка quick donate (EN)</Label>
              <Input value={quickDonateLabelEn} onChange={(e) => setQuickDonateLabelEn(e.target.value)} />
            </div>
          </div>
        </AdminSectionShell>

        <AdminSectionShell
          icon={LayoutGrid}
          title="Способи оплати"
          description="Картки над формою: назва UA/EN, якір (#card, #bank…) для посилання, широкий ряд для «інші способи»."
          storageKey={SUPPORT_SECTION_STORAGE_KEYS.paymentMethods}
        >
          <div className="space-y-3">
            {paymentMethods.map((m, i) => (
              <div
                key={m._key}
                className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card)/0.5)] p-4"
              >
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
                    Картка {i + 1}
                  </span>
                  <div className="flex flex-wrap gap-1">
                    <Button type="button" variant="secondary" size="sm" disabled={i === 0} onClick={() => movePm(i, -1)}>
                      Вгору
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={i === paymentMethods.length - 1}
                      onClick={() => movePm(i, 1)}
                    >
                      Вниз
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-red-500"
                      onClick={() => setPaymentMethods((p) => p.filter((x) => x._key !== m._key))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label>Назва UA</Label>
                    <Input
                      value={m.titleUk}
                      onChange={(e) =>
                        setPaymentMethods((p) =>
                          p.map((x) => (x._key === m._key ? { ...x, titleUk: e.target.value } : x)),
                        )
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Назва EN</Label>
                    <Input
                      value={m.titleEn}
                      onChange={(e) =>
                        setPaymentMethods((p) =>
                          p.map((x) => (x._key === m._key ? { ...x, titleEn: e.target.value } : x)),
                        )
                      }
                    />
                  </div>
                  <div className="grid gap-2 sm:col-span-2">
                    <Label>Якір (anchor id, без #)</Label>
                    <Input
                      placeholder="bank"
                      value={m.anchorId}
                      onChange={(e) =>
                        setPaymentMethods((p) =>
                          p.map((x) => (x._key === m._key ? { ...x, anchorId: e.target.value.trim() } : x)),
                        )
                      }
                    />
                  </div>
                  <label className="flex cursor-pointer items-center gap-2 sm:col-span-2">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border border-[hsl(var(--border))] bg-[hsl(var(--background))]"
                      checked={m.wide}
                      onChange={(e) =>
                        setPaymentMethods((p) =>
                          p.map((x) => (x._key === m._key ? { ...x, wide: e.target.checked } : x)),
                        )
                      }
                    />
                    <span className="text-sm text-[hsl(var(--foreground))]">Широка картка (на всю ширину сітки)</span>
                  </label>
                </div>
              </div>
            ))}
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() =>
                setPaymentMethods((p) => [
                  ...p,
                  { _key: crypto.randomUUID(), titleUk: '', titleEn: '', anchorId: '', wide: false },
                ])
              }
            >
              Додати спосіб оплати
            </Button>
          </div>
        </AdminSectionShell>

        <AdminSectionShell
          icon={HeartHandshake}
          title="Форма донату та QR"
          description="Заголовок секції з формою, пресети сум через кому, підпис під QR, завантаження зображення QR."
          storageKey={SUPPORT_SECTION_STORAGE_KEYS.formQr}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Заголовок секції (UA)</Label>
              <Input value={formSectionTitleUk} onChange={(e) => setFormSectionTitleUk(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Заголовок секції (EN)</Label>
              <Input value={formSectionTitleEn} onChange={(e) => setFormSectionTitleEn(e.target.value)} />
            </div>
            <div className="grid gap-2 sm:col-span-2">
              <Label>Пресети сум (числа через кому або пробіл)</Label>
              <Input
                value={presetAmountsStr}
                onChange={(e) => setPresetAmountsStr(e.target.value)}
                placeholder="150, 300, 500, 1000"
              />
            </div>
            <div className="grid gap-2">
              <Label>Підпис під QR (UA)</Label>
              <Input value={qrCaptionUk} onChange={(e) => setQrCaptionUk(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Підпис під QR (EN)</Label>
              <Input value={qrCaptionEn} onChange={(e) => setQrCaptionEn(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Текст біля чекбокса оферти (UA)</Label>
              <Input value={termsCheckboxUk} onChange={(e) => setTermsCheckboxUk(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Текст біля чекбокса (EN)</Label>
              <Input value={termsCheckboxEn} onChange={(e) => setTermsCheckboxEn(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Кнопка відправки (UA)</Label>
              <Input value={donateButtonLabelUk} onChange={(e) => setDonateButtonLabelUk(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Кнопка відправки (EN)</Label>
              <Input value={donateButtonLabelEn} onChange={(e) => setDonateButtonLabelEn(e.target.value)} />
            </div>
          </div>

          <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.12)] p-4">
            <Label className="mb-2 block">Зображення QR</Label>
            {qrImageUrl ? (
              <div className="mb-3 flex max-w-xs flex-col gap-2">
                <img
                  src={assetUrl(qrImageUrl)}
                  alt=""
                  className="rounded-lg border border-[hsl(var(--border))] bg-white p-2"
                />
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="secondary" size="sm" disabled={uploadingQr} asChild>
                    <label className="cursor-pointer">
                      <ImageUp className="mr-1 inline h-4 w-4" />
                      Замінити
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={uploadingQr}
                        onChange={(e) => void onQrUpload(e.target.files?.[0] ?? null)}
                      />
                    </label>
                  </Button>
                  <Button type="button" variant="ghost" size="sm" className="text-red-500" onClick={() => void onQrRemove()}>
                    Видалити QR
                  </Button>
                </div>
              </div>
            ) : (
              <Button type="button" variant="secondary" size="sm" disabled={uploadingQr} asChild>
                <label className="cursor-pointer">
                  <ImageUp className="mr-1 inline h-4 w-4" />
                  Завантажити QR
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploadingQr}
                    onChange={(e) => void onQrUpload(e.target.files?.[0] ?? null)}
                  />
                </label>
              </Button>
            )}
          </div>
        </AdminSectionShell>

        <AdminSectionShell
          icon={Landmark}
          title="Банківський переказ"
          description="Заголовок секції та картки з реквізитами (можна додати кілька валют / рахунків)."
          storageKey={SUPPORT_SECTION_STORAGE_KEYS.bank}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Заголовок секції (UA)</Label>
              <Input value={bankSectionTitleUk} onChange={(e) => setBankSectionTitleUk(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Заголовок секції (EN)</Label>
              <Input value={bankSectionTitleEn} onChange={(e) => setBankSectionTitleEn(e.target.value)} />
            </div>
          </div>
          <div className="space-y-3">
            {bankBlocks.map((b, i) => (
              <div key={b._key} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card)/0.5)] p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-medium text-[hsl(var(--muted-foreground))]">Реквізити {i + 1}</span>
                  <div className="flex flex-wrap gap-1">
                    <Button type="button" variant="secondary" size="sm" disabled={i === 0} onClick={() => moveBank(i, -1)}>
                      Вгору
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={i === bankBlocks.length - 1}
                      onClick={() => moveBank(i, 1)}
                    >
                      Вниз
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-red-500"
                      onClick={() => setBankBlocks((p) => p.filter((x) => x._key !== b._key))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label>Заголовок картки (UA)</Label>
                    <Input
                      value={b.titleUk}
                      onChange={(e) =>
                        setBankBlocks((p) =>
                          p.map((x) => (x._key === b._key ? { ...x, titleUk: e.target.value } : x)),
                        )
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Заголовок картки (EN)</Label>
                    <Input
                      value={b.titleEn}
                      onChange={(e) =>
                        setBankBlocks((p) =>
                          p.map((x) => (x._key === b._key ? { ...x, titleEn: e.target.value } : x)),
                        )
                      }
                    />
                  </div>
                  <div className="grid gap-2 sm:col-span-2">
                    <Label>Назва організації</Label>
                    <Input
                      value={b.organizationName}
                      onChange={(e) =>
                        setBankBlocks((p) =>
                          p.map((x) => (x._key === b._key ? { ...x, organizationName: e.target.value } : x)),
                        )
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>ЄДРПОУ</Label>
                    <Input
                      value={b.edrpou}
                      onChange={(e) =>
                        setBankBlocks((p) =>
                          p.map((x) => (x._key === b._key ? { ...x, edrpou: e.target.value } : x)),
                        )
                      }
                    />
                  </div>
                  <div className="grid gap-2 sm:col-span-2">
                    <Label>IBAN</Label>
                    <Input
                      value={b.iban}
                      onChange={(e) =>
                        setBankBlocks((p) => p.map((x) => (x._key === b._key ? { ...x, iban: e.target.value } : x)))
                      }
                    />
                  </div>
                </div>
              </div>
            ))}
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() =>
                setBankBlocks((p) => [
                  ...p,
                  {
                    _key: crypto.randomUUID(),
                    titleUk: '',
                    titleEn: '',
                    organizationName: '',
                    edrpou: '',
                    iban: '',
                  },
                ])
              }
            >
              Додати блок реквізитів
            </Button>
          </div>
        </AdminSectionShell>
      </div>

      <AdminPersistFooter
        saving={saving}
        onSave={() => void save()}
        disabled={saving || !dirty}
        message="Зміни на сайті застосовуються після натискання «Зберегти». QR можна оновити окремою кнопкою в блоці нижче."
      />
    </div>
  )
}
