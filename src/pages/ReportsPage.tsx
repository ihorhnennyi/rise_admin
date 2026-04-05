import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { apiFetch, ApiError } from '@admin/api/http'
import type {
  ReportCategoryMeta,
  ReportDocumentRow,
  ReportingBundle,
  ReportingStat,
} from '@admin/types/reporting'
import { API_BASE_URL } from '@admin/api/config'
import { Button } from '@admin/components/ui/button'
import { Input } from '@admin/components/ui/input'
import { Label } from '@admin/components/ui/label'
import { SelectMenu } from '@admin/components/ui/select-menu'
import { Textarea } from '@admin/components/ui/textarea'
import { toastError, toastInfo, toastSuccess } from '@admin/lib/toast'
import { AdminPersistFooter } from '@admin/components/AdminPersistFooter'
import { AdminSectionShell } from '@admin/components/AdminSectionShell'
import { AlertDialog } from '@admin/components/ui/alert-dialog'
import { BarChart3, FileStack, FileText, ImageUp, Trash2 } from 'lucide-react'

type UiStat = ReportingStat & { _key: string }

const STAT_SIZE_OPTIONS = [
  { value: 'lg', label: 'Велике (lg)' },
  { value: 'md', label: 'Середнє (md)' },
  { value: 'sm', label: 'Мале (sm)' },
] as const

const STAT_TONE_OPTIONS = [
  { value: 'yellow', label: 'Жовтий' },
  { value: 'blue', label: 'Блакитний' },
] as const

function withStatKeys(list: ReportingStat[]): UiStat[] {
  return list.map((x) => ({ ...x, _key: crypto.randomUUID() }))
}

function stripStatKeys(list: UiStat[]): ReportingStat[] {
  return list.map(({ _key: _k, ...r }) => r)
}

function pagePayloadFromState(args: {
  resultsTitleUk: string
  resultsTitleEn: string
  resultsBodyUk: string
  resultsBodyEn: string
  stats: UiStat[]
  documentsSectionTitleUk: string
  documentsSectionTitleEn: string
  documentsSectionBodyUk: string
  documentsSectionBodyEn: string
}) {
  return {
    resultsTitleUk: args.resultsTitleUk,
    resultsTitleEn: args.resultsTitleEn,
    resultsBodyUk: args.resultsBodyUk,
    resultsBodyEn: args.resultsBodyEn,
    stats: stripStatKeys(args.stats),
    documentsSectionTitleUk: args.documentsSectionTitleUk,
    documentsSectionTitleEn: args.documentsSectionTitleEn,
    documentsSectionBodyUk: args.documentsSectionBodyUk,
    documentsSectionBodyEn: args.documentsSectionBodyEn,
  }
}

function pageSignature(p: ReturnType<typeof pagePayloadFromState>): string {
  return JSON.stringify(p)
}

function filePublicUrl(path: string | null) {
  if (!path) return ''
  const origin = API_BASE_URL.replace(/\/api$/, '')
  return `${origin}${path}`
}

const REPORTS_SECTION_STORAGE_KEYS = {
  generalResults: 'rise-admin:reports:section:general-results',
  documentsCopy: 'rise-admin:reports:section:documents-section-copy',
  files: 'rise-admin:reports:section:files',
} as const

export function ReportsPage() {
  const [loading, setLoading] = useState(true)
  const [savingPage, setSavingPage] = useState(false)
  const [categories, setCategories] = useState<ReportCategoryMeta[]>([])

  const [resultsTitleUk, setResultsTitleUk] = useState('')
  const [resultsTitleEn, setResultsTitleEn] = useState('')
  const [resultsBodyUk, setResultsBodyUk] = useState('')
  const [resultsBodyEn, setResultsBodyEn] = useState('')
  const [stats, setStats] = useState<UiStat[]>([])

  const [documentsSectionTitleUk, setDocumentsSectionTitleUk] = useState('')
  const [documentsSectionTitleEn, setDocumentsSectionTitleEn] = useState('')
  const [documentsSectionBodyUk, setDocumentsSectionBodyUk] = useState('')
  const [documentsSectionBodyEn, setDocumentsSectionBodyEn] = useState('')

  const [documents, setDocuments] = useState<ReportDocumentRow[]>([])
  const [newTitleUk, setNewTitleUk] = useState('')
  const [newTitleEn, setNewTitleEn] = useState('')
  const [newCategory, setNewCategory] = useState('annual')
  const [newSort, setNewSort] = useState('0')
  const [adding, setAdding] = useState(false)
  const [deleteDocId, setDeleteDocId] = useState<string | null>(null)
  const [deletingDoc, setDeletingDoc] = useState(false)

  const initialPageRef = useRef<string>('')

  const applyBundle = useCallback((b: ReportingBundle) => {
    setResultsTitleUk(b.resultsTitleUk)
    setResultsTitleEn(b.resultsTitleEn)
    setResultsBodyUk(b.resultsBodyUk)
    setResultsBodyEn(b.resultsBodyEn)
    setStats(withStatKeys(b.stats ?? []))
    setDocumentsSectionTitleUk(b.documentsSectionTitleUk)
    setDocumentsSectionTitleEn(b.documentsSectionTitleEn)
    setDocumentsSectionBodyUk(b.documentsSectionBodyUk)
    setDocumentsSectionBodyEn(b.documentsSectionBodyEn)
    setDocuments(b.documents ?? [])
    setCategories(b.categories ?? [])
    initialPageRef.current = pageSignature(
      pagePayloadFromState({
        resultsTitleUk: b.resultsTitleUk,
        resultsTitleEn: b.resultsTitleEn,
        resultsBodyUk: b.resultsBodyUk,
        resultsBodyEn: b.resultsBodyEn,
        stats: withStatKeys(b.stats ?? []),
        documentsSectionTitleUk: b.documentsSectionTitleUk,
        documentsSectionTitleEn: b.documentsSectionTitleEn,
        documentsSectionBodyUk: b.documentsSectionBodyUk,
        documentsSectionBodyEn: b.documentsSectionBodyEn,
      }),
    )
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const b = await apiFetch<ReportingBundle>('/reporting')
      applyBundle(b)
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) return
      toastError('Помилка', 'Не вдалося завантажити «Звітність та документи».')
    } finally {
      setLoading(false)
    }
  }, [applyBundle])

  useEffect(() => {
    void load()
  }, [load])

  const pagePatch = useMemo(
    () =>
      pageSignature(
        pagePayloadFromState({
          resultsTitleUk,
          resultsTitleEn,
          resultsBodyUk,
          resultsBodyEn,
          stats,
          documentsSectionTitleUk,
          documentsSectionTitleEn,
          documentsSectionBodyUk,
          documentsSectionBodyEn,
        }),
      ),
    [
      resultsTitleUk,
      resultsTitleEn,
      resultsBodyUk,
      resultsBodyEn,
      stats,
      documentsSectionTitleUk,
      documentsSectionTitleEn,
      documentsSectionBodyUk,
      documentsSectionBodyEn,
    ],
  )

  const pageDirty = pagePatch !== initialPageRef.current

  const categoryOptionsNew = useMemo(
    () => categories.map((c) => ({ value: c.slug, label: `${c.labelUk} (${c.slug})` })),
    [categories],
  )

  const categoryOptionsRow = useMemo(
    () => categories.map((c) => ({ value: c.slug, label: c.labelUk })),
    [categories],
  )

  async function savePage() {
    setSavingPage(true)
    try {
      const payload = pagePayloadFromState({
        resultsTitleUk,
        resultsTitleEn,
        resultsBodyUk,
        resultsBodyEn,
        stats,
        documentsSectionTitleUk,
        documentsSectionTitleEn,
        documentsSectionBodyUk,
        documentsSectionBodyEn,
      })
      await apiFetch('/reporting/page', { method: 'PATCH', json: payload })
      initialPageRef.current = pageSignature(payload)
      toastSuccess('Збережено', 'Тексти та лічильники оновлені.')
    } catch {
      toastError('Помилка', 'Не вдалося зберегти сторінку.')
    } finally {
      setSavingPage(false)
    }
  }

  function moveStat(i: number, dir: -1 | 1) {
    const j = i + dir
    if (j < 0 || j >= stats.length) return
    setStats((prev) => {
      const next = [...prev]
      ;[next[i], next[j]] = [next[j], next[i]]
      return next
    })
  }

  async function addDocument() {
    if (!newTitleUk.trim()) {
      toastError('Помилка', 'Вкажіть назву (UA).')
      return
    }
    setAdding(true)
    try {
      await apiFetch<ReportDocumentRow>('/reporting/documents', {
        method: 'POST',
        json: {
          titleUk: newTitleUk.trim(),
          titleEn: newTitleEn.trim() || undefined,
          category: newCategory,
          sortOrder: Number(newSort) || 0,
        },
      })
      setNewTitleUk('')
      setNewTitleEn('')
      setNewSort('0')
      await load()
      toastSuccess('Додано', 'Запис створено. Завантажте файл.')
    } catch {
      toastError('Помилка', 'Не вдалося створити запис.')
    } finally {
      setAdding(false)
    }
  }

  async function saveDocumentRow(d: ReportDocumentRow) {
    try {
      await apiFetch(`/reporting/documents/${d._id}`, {
        method: 'PATCH',
        json: {
          titleUk: d.titleUk,
          titleEn: d.titleEn,
          category: d.category,
          sortOrder: d.sortOrder,
        },
      })
      await load()
      toastSuccess('Збережено', 'Запис оновлено.')
    } catch {
      toastError('Помилка', 'Не вдалося зберегти запис.')
    }
  }

  async function confirmDeleteDocument() {
    if (!deleteDocId) return
    setDeletingDoc(true)
    try {
      await apiFetch(`/reporting/documents/${deleteDocId}`, { method: 'DELETE' })
      await load()
      toastSuccess('Видалено', '')
      setDeleteDocId(null)
    } catch {
      toastError('Помилка', 'Не вдалося видалити.')
    } finally {
      setDeletingDoc(false)
    }
  }

  async function uploadDocFile(id: string, file: File | null) {
    if (!file) return
    try {
      toastInfo('Завантаження…', file.name)
      const form = new FormData()
      form.append('file', file)
      await apiFetch(`/reporting/documents/${id}/file`, { method: 'POST', body: form })
      await load()
      toastSuccess('Файл додано', '')
    } catch {
      toastError('Помилка', 'Не вдалося завантажити файл.')
    }
  }

  async function removeDocFile(id: string) {
    try {
      await apiFetch(`/reporting/documents/${id}/file`, { method: 'DELETE' })
      await load()
      toastSuccess('Файл прибрано', '')
    } catch {
      toastError('Помилка', 'Не вдалося видалити файл.')
    }
  }

  function updateDocLocal(id: string, patch: Partial<ReportDocumentRow>) {
    setDocuments((prev) => prev.map((x) => (x._id === id ? { ...x, ...patch } : x)))
  }

  if (loading) {
    return <div className="text-sm text-[hsl(var(--muted-foreground))]">Завантаження…</div>
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-28">
      <div className="border-b border-[hsl(var(--border))] pb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-[hsl(var(--foreground))]">
          Звітність та документи
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">
          Блок «Загальні результати» (текст і лічильники-кола), потім секція з фільтрами за категоріями та списком
          файлів. Документи зберігаються окремо — після змін у рядку натискайте «Зберегти запис». Тексти секцій —
          кнопка «Зберегти» внизу.
        </p>
      </div>

      <div className="grid gap-5">
        <AdminSectionShell
          icon={BarChart3}
          title="Загальні результати"
          description="Заголовок і текст над лічильниками. Кожен показник: значення (можна «560+»), підпис UA/EN, розмір і колір кола на сайті."
          storageKey={REPORTS_SECTION_STORAGE_KEYS.generalResults}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Заголовок (UA)</Label>
              <Input value={resultsTitleUk} onChange={(e) => setResultsTitleUk(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Заголовок (EN)</Label>
              <Input value={resultsTitleEn} onChange={(e) => setResultsTitleEn(e.target.value)} />
            </div>
            <div className="grid gap-2 sm:col-span-2">
              <Label>Текст (UA)</Label>
              <Textarea rows={4} value={resultsBodyUk} onChange={(e) => setResultsBodyUk(e.target.value)} />
            </div>
            <div className="grid gap-2 sm:col-span-2">
              <Label>Текст (EN)</Label>
              <Textarea rows={4} value={resultsBodyEn} onChange={(e) => setResultsBodyEn(e.target.value)} />
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <Label className="text-sm font-medium">Лічильники</Label>
            {stats.map((s, i) => (
              <div key={s._key} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card)/0.5)] p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs text-[hsl(var(--muted-foreground))]">Показник {i + 1}</span>
                  <div className="flex flex-wrap gap-1">
                    <Button type="button" variant="secondary" size="sm" disabled={i === 0} onClick={() => moveStat(i, -1)}>
                      Вгору
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={i === stats.length - 1}
                      onClick={() => moveStat(i, 1)}
                    >
                      Вниз
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-red-500"
                      onClick={() => setStats((p) => p.filter((x) => x._key !== s._key))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label>Значення</Label>
                    <Input
                      value={s.value}
                      onChange={(e) =>
                        setStats((p) => p.map((x) => (x._key === s._key ? { ...x, value: e.target.value } : x)))
                      }
                      placeholder="8067"
                    />
                  </div>
                  <div className="grid gap-2 sm:col-span-2">
                    <Label>Підпис (UA)</Label>
                    <Input
                      value={s.labelUk}
                      onChange={(e) =>
                        setStats((p) => p.map((x) => (x._key === s._key ? { ...x, labelUk: e.target.value } : x)))
                      }
                    />
                  </div>
                  <div className="grid gap-2 sm:col-span-2">
                    <Label>Підпис (EN)</Label>
                    <Input
                      value={s.labelEn}
                      onChange={(e) =>
                        setStats((p) => p.map((x) => (x._key === s._key ? { ...x, labelEn: e.target.value } : x)))
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Розмір кола</Label>
                    <SelectMenu
                      value={s.size}
                      options={[...STAT_SIZE_OPTIONS]}
                      onValueChange={(v) =>
                        setStats((p) =>
                          p.map((x) =>
                            x._key === s._key ? { ...x, size: v as ReportingStat['size'] } : x,
                          ),
                        )
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Колір</Label>
                    <SelectMenu
                      value={s.tone}
                      options={[...STAT_TONE_OPTIONS]}
                      onValueChange={(v) =>
                        setStats((p) =>
                          p.map((x) =>
                            x._key === s._key ? { ...x, tone: v as ReportingStat['tone'] } : x,
                          ),
                        )
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
                setStats((p) => [
                  ...p,
                  {
                    _key: crypto.randomUUID(),
                    value: '',
                    labelUk: '',
                    labelEn: '',
                    size: 'md',
                    tone: 'yellow',
                  },
                ])
              }
            >
              Додати показник
            </Button>
          </div>
        </AdminSectionShell>

        <AdminSectionShell
          icon={FileText}
          title="Секція «Звітність та документи»"
          description="Заголовок і вступний текст над списком файлів і фільтрами-категоріями на сайті."
          storageKey={REPORTS_SECTION_STORAGE_KEYS.documentsCopy}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Заголовок (UA)</Label>
              <Input value={documentsSectionTitleUk} onChange={(e) => setDocumentsSectionTitleUk(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Заголовок (EN)</Label>
              <Input value={documentsSectionTitleEn} onChange={(e) => setDocumentsSectionTitleEn(e.target.value)} />
            </div>
            <div className="grid gap-2 sm:col-span-2">
              <Label>Текст (UA)</Label>
              <Textarea
                rows={3}
                value={documentsSectionBodyUk}
                onChange={(e) => setDocumentsSectionBodyUk(e.target.value)}
              />
            </div>
            <div className="grid gap-2 sm:col-span-2">
              <Label>Текст (EN)</Label>
              <Textarea
                rows={3}
                value={documentsSectionBodyEn}
                onChange={(e) => setDocumentsSectionBodyEn(e.target.value)}
              />
            </div>
          </div>
        </AdminSectionShell>

        <AdminSectionShell
          icon={FileStack}
          title="Файли та категорії"
          description="Категорії фіксовані (річний/місячний звіт тощо). Для кожного запису — назва, категорія, порядок, PDF/DOC/DOCX."
          defaultOpen
          storageKey={REPORTS_SECTION_STORAGE_KEYS.files}
        >
          <div className="rounded-xl border border-dashed border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.12)] p-4">
            <p className="mb-3 text-xs font-medium text-[hsl(var(--muted-foreground))]">Новий документ</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>Назва (UA) *</Label>
                <Input value={newTitleUk} onChange={(e) => setNewTitleUk(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Назва (EN)</Label>
                <Input value={newTitleEn} onChange={(e) => setNewTitleEn(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Категорія</Label>
                <SelectMenu
                  value={newCategory}
                  options={categoryOptionsNew}
                  onValueChange={setNewCategory}
                />
              </div>
              <div className="grid gap-2">
                <Label>Порядок (число)</Label>
                <Input value={newSort} onChange={(e) => setNewSort(e.target.value)} />
              </div>
            </div>
            <Button type="button" className="mt-3" size="sm" disabled={adding} onClick={() => void addDocument()}>
              {adding ? 'Створюю…' : 'Створити запис'}
            </Button>
          </div>

          <div className="space-y-4 pt-2">
            {documents.length === 0 ? (
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Поки що немає файлів. Створіть запис вище.</p>
            ) : null}
            {documents.map((d) => (
              <div key={d._id} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card)/0.5)] p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono text-[11px] text-[hsl(var(--muted-foreground))]">{d._id}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-red-500"
                    onClick={() => setDeleteDocId(d._id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label>Назва (UA)</Label>
                    <Input value={d.titleUk} onChange={(e) => updateDocLocal(d._id, { titleUk: e.target.value })} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Назва (EN)</Label>
                    <Input value={d.titleEn} onChange={(e) => updateDocLocal(d._id, { titleEn: e.target.value })} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Категорія</Label>
                    <SelectMenu
                      value={d.category}
                      options={categoryOptionsRow}
                      onValueChange={(v) => updateDocLocal(d._id, { category: v })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Порядок</Label>
                    <Input
                      type="number"
                      value={d.sortOrder}
                      onChange={(e) => updateDocLocal(d._id, { sortOrder: Number(e.target.value) || 0 })}
                    />
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button type="button" size="sm" onClick={() => void saveDocumentRow(d)}>
                    Зберегти запис
                  </Button>
                  {d.fileUrl ? (
                    <>
                      <Button type="button" variant="secondary" size="sm" asChild>
                        <a href={filePublicUrl(d.fileUrl)} target="_blank" rel="noreferrer">
                          Відкрити файл
                        </a>
                      </Button>
                      <Button type="button" variant="secondary" size="sm" disabled={adding} asChild>
                        <label className="cursor-pointer">
                          <ImageUp className="mr-1 inline h-4 w-4" />
                          Замінити файл
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                            className="hidden"
                            onChange={(e) => void uploadDocFile(d._id, e.target.files?.[0] ?? null)}
                          />
                        </label>
                      </Button>
                      <Button type="button" variant="ghost" size="sm" onClick={() => void removeDocFile(d._id)}>
                        Прибрати файл
                      </Button>
                    </>
                  ) : (
                    <Button type="button" variant="secondary" size="sm" asChild>
                      <label className="cursor-pointer">
                        <ImageUp className="mr-1 inline h-4 w-4" />
                        Завантажити PDF / DOC
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                          className="hidden"
                          onChange={(e) => void uploadDocFile(d._id, e.target.files?.[0] ?? null)}
                        />
                      </label>
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </AdminSectionShell>
      </div>

      <AlertDialog
        open={Boolean(deleteDocId)}
        title="Видалити запис і файл на сервері?"
        cancelText="Скасувати"
        confirmText={deletingDoc ? 'Видаляю…' : 'Видалити'}
        destructive
        confirmDisabled={deletingDoc}
        onCancel={() => !deletingDoc && setDeleteDocId(null)}
        onConfirm={confirmDeleteDocument}
      />

      <AdminPersistFooter
        saving={savingPage}
        onSave={() => void savePage()}
        disabled={savingPage || !pageDirty}
        message="Збереження стосується лише текстів і лічильників. Документи зберігаються кнопкою «Зберегти запис» у кожному блоці."
      />
    </div>
  )
}
