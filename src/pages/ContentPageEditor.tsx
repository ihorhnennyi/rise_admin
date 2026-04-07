import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { apiFetch, ApiError } from '@admin/api/http'
import { AdminPersistFooter } from '@admin/components/AdminPersistFooter'
import { Button } from '@admin/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@admin/components/ui/card'
import { Label } from '@admin/components/ui/label'
import { Input } from '@admin/components/ui/input'
import { Textarea } from '@admin/components/ui/textarea'
import { RichTextEditor } from '@admin/components/RichTextEditor'
import { toastError, toastSuccess } from '@admin/lib/toast'
import { API_BASE_URL } from '@admin/api/config'
import { usePersistedJsonAutosave } from '@admin/hooks/usePersistedJsonAutosave'
import {
  collapsedArrayToMap,
  readCollapsedBooleanArray,
  writeCollapsedBooleanArray,
} from '@admin/lib/section-storage'
import { cn } from '@admin/lib/utils'
import { ChevronDown, ImageIcon, Trash2 } from 'lucide-react'

function extFromFileName(name: string): string {
  const m = /\.([a-z0-9]+)$/i.exec(name || '')
  return m ? `.${m[1].toLowerCase()}` : '.jpg'
}

type ContentPage = {
  _id?: string
  key: string
  titleUk?: string
  titleEn?: string
  contentUk?: string
  contentEn?: string
  coverImageUrl?: string | null
  blocks?: Array<{
    titleUk?: string
    titleEn?: string
    excerptUk?: string
    excerptEn?: string
    imageUrl?: string | null
  }>
  afterBlocks?: Array<{
    titleUk?: string
    titleEn?: string
    excerptUk?: string
    excerptEn?: string
  }>
  valuesTitleUk?: string
  valuesTitleEn?: string
  valuesItems?: Array<{
    titleUk?: string
    titleEn?: string
    descriptionUk?: string
    descriptionEn?: string
    size?: 'sm' | 'md' | 'lg' | 'xl'
    variant?: 'blue' | 'gold'
    slot?: number
  }>
  teamTitleUk?: string
  teamTitleEn?: string
  teamMembers?: Array<{
    nameUk?: string
    nameEn?: string
    roleUk?: string
    roleEn?: string
    imageUrl?: string | null
  }>
  volunteerTitleUk?: string
  volunteerTitleEn?: string
  volunteerPhotos?: Array<{ imageUrl?: string | null }>
  updatedAt?: string
}

type UiBlock = NonNullable<ContentPage['blocks']>[number] & { __key: string }
type UiAfterBlock = NonNullable<ContentPage['afterBlocks']>[number] & { __key: string }
type UiValueItem = NonNullable<ContentPage['valuesItems']>[number] & { __key: string }
type UiTeamMember = NonNullable<ContentPage['teamMembers']>[number] & { __key: string }
type UiVolunteerPhoto = NonNullable<ContentPage['volunteerPhotos']>[number] & { __key: string }

export function ContentPageEditor(props: {
  pageKey: string
  pageHeading: string
  /** Підзаголовок під H1 (за замовчуванням — загальний текст про редагування сторінки). */
  pageDescription?: string
  defaultTitle: string
  /** Заголовок EN, якщо запису в БД ще немає. */
  defaultTitleEn?: string
  /** Якщо сторінки ще немає в БД (перше відкриття), підставити цей HTML у редактор. */
  defaultContentUk?: string
  defaultContentEn?: string
  placeholder?: string
  enableCover?: boolean
  enableBlocks?: boolean
  enableAfterBlocks?: boolean
  /** Якщо з бекенда прийшов порожній afterBlocks — підставити ці блоки (наприклад Місія / Візія). */
  defaultAfterBlocks?: NonNullable<ContentPage['afterBlocks']>
  enableValuesSection?: boolean
  defaultValuesTitleUk?: string
  defaultValuesTitleEn?: string
  defaultValuesItems?: NonNullable<ContentPage['valuesItems']>
  enableTeamSection?: boolean
  defaultTeamTitleUk?: string
  defaultTeamTitleEn?: string
  defaultTeamMembers?: NonNullable<ContentPage['teamMembers']>
  enableVolunteersSection?: boolean
  defaultVolunteerTitleUk?: string
  defaultVolunteerTitleEn?: string
  enableText?: boolean
}) {
  const {
    pageKey,
    pageHeading,
    pageDescription = 'Тут можна створити та редагувати контент сторінки.',
    defaultTitle,
    defaultTitleEn,
    defaultContentUk,
    defaultContentEn,
    placeholder,
    enableCover,
    enableBlocks,
    enableAfterBlocks,
    defaultAfterBlocks,
    enableValuesSection,
    defaultValuesTitleUk,
    defaultValuesTitleEn,
    defaultValuesItems,
    enableTeamSection,
    defaultTeamTitleUk,
    defaultTeamTitleEn,
    defaultTeamMembers,
    enableVolunteersSection,
    defaultVolunteerTitleUk,
    defaultVolunteerTitleEn,
    enableText = true,
  } = props

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)
  const [teamImageBusy, setTeamImageBusy] = useState<{ index: number; mode: 'upload' | 'delete' } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [lang, setLang] = useState<'uk' | 'en'>('uk')
  const [titleUk, setTitleUk] = useState(defaultTitle)
  const [titleEn, setTitleEn] = useState('')
  const [contentUk, setContentUk] = useState('')
  const [contentEn, setContentEn] = useState('')
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null)
  const [blocks, setBlocks] = useState<UiBlock[]>([])
  const [afterBlocks, setAfterBlocks] = useState<UiAfterBlock[]>([])
  const [valuesTitleUk, setValuesTitleUk] = useState('')
  const [valuesTitleEn, setValuesTitleEn] = useState('')
  const [valuesItems, setValuesItems] = useState<UiValueItem[]>([])
  const [teamTitleUk, setTeamTitleUk] = useState('')
  const [teamTitleEn, setTeamTitleEn] = useState('')
  const [teamMembers, setTeamMembers] = useState<UiTeamMember[]>([])
  const [volunteerTitleUk, setVolunteerTitleUk] = useState('')
  const [volunteerTitleEn, setVolunteerTitleEn] = useState('')
  const [volunteerPhotos, setVolunteerPhotos] = useState<UiVolunteerPhoto[]>([])
  const [collapsedByKey, setCollapsedByKey] = useState<Record<string, boolean>>({})
  const [afterCollapsedByKey, setAfterCollapsedByKey] = useState<Record<string, boolean>>({})
  const [valuesCollapsedByKey, setValuesCollapsedByKey] = useState<Record<string, boolean>>({})
  const [teamCollapsedByKey, setTeamCollapsedByKey] = useState<Record<string, boolean>>({})
  /** Щоб не писати в localStorage згортання з «чужого» pageKey під час перезавантаження даних */
  const [accordionHydratedForPageKey, setAccordionHydratedForPageKey] = useState<string | null>(null)
  const coverInputRef = useRef<HTMLInputElement | null>(null)
  const blockInputRefs = useRef<Record<number, HTMLInputElement | null>>({})
  const teamInputRefs = useRef<Record<number, HTMLInputElement | null>>({})
  const volunteerInputRefs = useRef<Record<number, HTMLInputElement | null>>({})
  const initialRef = useRef<string>('')

  function stripUiKeys(list: UiBlock[]): NonNullable<ContentPage['blocks']> {
    return list.map(({ __key: _k, ...rest }) => rest)
  }

  function withUiKeys(list: NonNullable<ContentPage['blocks']>, prev?: UiBlock[]): UiBlock[] {
    return list.map((b, i) => ({
      ...(b as any),
      __key: prev?.[i]?.__key ?? crypto.randomUUID(),
    }))
  }

  function stripAfterUiKeys(list: UiAfterBlock[]): NonNullable<ContentPage['afterBlocks']> {
    return list.map(({ __key: _k, ...rest }) => rest)
  }

  function withAfterUiKeys(list: NonNullable<ContentPage['afterBlocks']>, prev?: UiAfterBlock[]): UiAfterBlock[] {
    return list.map((b, i) => ({
      ...(b as any),
      __key: prev?.[i]?.__key ?? crypto.randomUUID(),
    }))
  }

  function resolveAfterBlocks(
    fromApi: unknown,
    defaults?: NonNullable<ContentPage['afterBlocks']>,
  ): NonNullable<ContentPage['afterBlocks']> {
    const arr = Array.isArray(fromApi) ? (fromApi as NonNullable<ContentPage['afterBlocks']>) : []
    if (arr.length > 0) return arr
    return defaults?.length ? [...defaults] : []
  }

  function stripValuesUiKeys(list: UiValueItem[]): NonNullable<ContentPage['valuesItems']> {
    return list.map(({ __key: _k, ...rest }) => rest)
  }

  function withValuesUiKeys(
    list: NonNullable<ContentPage['valuesItems']>,
    prev?: UiValueItem[],
  ): UiValueItem[] {
    return list.map((b, i) => ({
      ...(b as any),
      __key: prev?.[i]?.__key ?? crypto.randomUUID(),
    }))
  }

  function resolveValuesTitle(from: unknown, fallback: string) {
    const t = typeof from === 'string' ? from.trim() : ''
    return t || fallback
  }

  function resolveValuesItems(
    fromApi: unknown,
    defaults?: NonNullable<ContentPage['valuesItems']>,
  ): NonNullable<ContentPage['valuesItems']> {
    const arr = Array.isArray(fromApi) ? (fromApi as NonNullable<ContentPage['valuesItems']>) : []
    if (arr.length > 0) return arr
    return defaults?.length ? [...defaults] : []
  }

  function stripTeamUiKeys(list: UiTeamMember[]): NonNullable<ContentPage['teamMembers']> {
    return list.map(({ __key: _k, ...rest }) => rest)
  }

  function withTeamUiKeys(
    list: NonNullable<ContentPage['teamMembers']>,
    prev?: UiTeamMember[],
  ): UiTeamMember[] {
    return list.map((b, i) => ({
      ...(b as any),
      __key: prev?.[i]?.__key ?? crypto.randomUUID(),
    }))
  }

  function resolveTeamMembers(
    fromApi: unknown,
    defaults?: NonNullable<ContentPage['teamMembers']>,
  ): NonNullable<ContentPage['teamMembers']> {
    const arr = Array.isArray(fromApi) ? (fromApi as NonNullable<ContentPage['teamMembers']>) : []
    if (arr.length > 0) return arr
    return defaults?.length ? [...defaults] : []
  }

  function stripVolunteerUiKeys(list: UiVolunteerPhoto[]): NonNullable<ContentPage['volunteerPhotos']> {
    return list.map(({ __key: _k, ...rest }) => rest)
  }

  function withVolunteerUiKeys(
    list: NonNullable<ContentPage['volunteerPhotos']>,
    prev?: UiVolunteerPhoto[],
  ): UiVolunteerPhoto[] {
    return list.map((b, i) => ({
      ...(b as any),
      __key: prev?.[i]?.__key ?? crypto.randomUUID(),
    }))
  }

  function resolveVolunteerPhotos(fromApi: unknown): NonNullable<ContentPage['volunteerPhotos']> {
    const arr = Array.isArray(fromApi) ? (fromApi as NonNullable<ContentPage['volunteerPhotos']>) : []
    return arr.map((x) => ({ imageUrl: (x as any)?.imageUrl ?? null }))
  }

  function toggleCollapsed(key: string) {
    // Accordion behavior: expand one block, collapse others.
    setCollapsedByKey((prev) => {
      const next: Record<string, boolean> = {}
      const willExpand = prev[key] ?? true // default collapsed
      for (const b of blocks) {
        next[b.__key] = b.__key === key ? !willExpand : true
      }
      return next
    })
  }

  function toggleAfterCollapsed(key: string) {
    setAfterCollapsedByKey((prev) => {
      const next: Record<string, boolean> = {}
      const willExpand = prev[key] ?? true // default collapsed
      for (const b of afterBlocks) {
        next[b.__key] = b.__key === key ? !willExpand : true
      }
      return next
    })
  }

  function toggleValuesCollapsed(key: string) {
    setValuesCollapsedByKey((prev) => {
      const next: Record<string, boolean> = {}
      const willExpand = prev[key] ?? true
      for (const b of valuesItems) {
        next[b.__key] = b.__key === key ? !willExpand : true
      }
      return next
    })
  }

  function toggleTeamCollapsed(key: string) {
    setTeamCollapsedByKey((prev) => {
      const next: Record<string, boolean> = {}
      const willExpand = prev[key] ?? true
      for (const b of teamMembers) {
        next[b.__key] = b.__key === key ? !willExpand : true
      }
      return next
    })
  }

  useEffect(() => {
    // Keep collapse state stable and default to expanded for new blocks.
    setCollapsedByKey((prev) => {
      let changed = false
      const next: Record<string, boolean> = {}
      for (const b of blocks) {
        if (Object.prototype.hasOwnProperty.call(prev, b.__key)) next[b.__key] = prev[b.__key]
        else {
          // default collapsed
          next[b.__key] = true
          changed = true
        }
      }
      // prune removed keys
      if (!changed && Object.keys(prev).length !== Object.keys(next).length) changed = true
      return changed ? next : prev
    })
  }, [blocks])

  useEffect(() => {
    setAfterCollapsedByKey((prev) => {
      let changed = false
      const next: Record<string, boolean> = {}
      for (const b of afterBlocks) {
        if (Object.prototype.hasOwnProperty.call(prev, b.__key)) next[b.__key] = prev[b.__key]
        else {
          next[b.__key] = true
          changed = true
        }
      }
      if (!changed && Object.keys(prev).length !== Object.keys(next).length) changed = true
      return changed ? next : prev
    })
  }, [afterBlocks])

  useEffect(() => {
    setValuesCollapsedByKey((prev) => {
      let changed = false
      const next: Record<string, boolean> = {}
      for (const b of valuesItems) {
        if (Object.prototype.hasOwnProperty.call(prev, b.__key)) next[b.__key] = prev[b.__key]
        else {
          next[b.__key] = true
          changed = true
        }
      }
      if (!changed && Object.keys(prev).length !== Object.keys(next).length) changed = true
      return changed ? next : prev
    })
  }, [valuesItems])

  useEffect(() => {
    setTeamCollapsedByKey((prev) => {
      let changed = false
      const next: Record<string, boolean> = {}
      for (const b of teamMembers) {
        if (Object.prototype.hasOwnProperty.call(prev, b.__key)) next[b.__key] = prev[b.__key]
        else {
          next[b.__key] = true
          changed = true
        }
      }
      if (!changed && Object.keys(prev).length !== Object.keys(next).length) changed = true
      return changed ? next : prev
    })
  }, [teamMembers])

  useLayoutEffect(() => {
    setAccordionHydratedForPageKey(null)
  }, [pageKey])

  useEffect(() => {
    if (loading || accordionHydratedForPageKey !== pageKey) return
    writeCollapsedBooleanArray(
      `rise-admin:content:${pageKey}:accordion-blocks`,
      blocks.map((b) => b.__key),
      collapsedByKey,
      true,
    )
  }, [loading, pageKey, accordionHydratedForPageKey, blocks, collapsedByKey])

  useEffect(() => {
    if (loading || accordionHydratedForPageKey !== pageKey) return
    writeCollapsedBooleanArray(
      `rise-admin:content:${pageKey}:accordion-after`,
      afterBlocks.map((b) => b.__key),
      afterCollapsedByKey,
      true,
    )
  }, [loading, pageKey, accordionHydratedForPageKey, afterBlocks, afterCollapsedByKey])

  useEffect(() => {
    if (loading || accordionHydratedForPageKey !== pageKey) return
    writeCollapsedBooleanArray(
      `rise-admin:content:${pageKey}:accordion-values`,
      valuesItems.map((b) => b.__key),
      valuesCollapsedByKey,
      true,
    )
  }, [loading, pageKey, accordionHydratedForPageKey, valuesItems, valuesCollapsedByKey])

  useEffect(() => {
    if (loading || accordionHydratedForPageKey !== pageKey) return
    writeCollapsedBooleanArray(
      `rise-admin:content:${pageKey}:accordion-team`,
      teamMembers.map((b) => b.__key),
      teamCollapsedByKey,
      true,
    )
  }, [loading, pageKey, accordionHydratedForPageKey, teamMembers, teamCollapsedByKey])

  useEffect(() => {
    let cancelled = false
    async function run() {
      try {
        const data = await apiFetch<ContentPage>(`/content/${pageKey}`)
        if (cancelled) return
        setTitleUk(data.titleUk?.toString() || defaultTitle)
        setTitleEn(data.titleEn?.toString() || '')
        setContentUk(data.contentUk?.toString() || '')
        setContentEn(data.contentEn?.toString() || '')
        setCoverImageUrl((data.coverImageUrl ?? null) as any)
        const nextBlocks = withUiKeys(Array.isArray(data.blocks) ? (data.blocks as any) : [], undefined)
        setBlocks(nextBlocks)
        setCollapsedByKey(
          collapsedArrayToMap(
            nextBlocks.map((b) => b.__key),
            readCollapsedBooleanArray(`rise-admin:content:${pageKey}:accordion-blocks`),
            true,
          ),
        )
        const afterResolved = enableAfterBlocks ? resolveAfterBlocks(data.afterBlocks, defaultAfterBlocks) : []
        const nextAfter = withAfterUiKeys(afterResolved, undefined)
        setAfterBlocks(nextAfter)
        setAfterCollapsedByKey(
          collapsedArrayToMap(
            nextAfter.map((b) => b.__key),
            readCollapsedBooleanArray(`rise-admin:content:${pageKey}:accordion-after`),
            true,
          ),
        )
        const valuesItemsResolved = enableValuesSection
          ? resolveValuesItems(data.valuesItems, defaultValuesItems)
          : []
        const valuesTitleUkResolved = enableValuesSection
          ? resolveValuesTitle(data.valuesTitleUk, defaultValuesTitleUk ?? '')
          : ''
        const valuesTitleEnResolved = enableValuesSection
          ? resolveValuesTitle(data.valuesTitleEn, defaultValuesTitleEn ?? '')
          : ''
        setValuesTitleUk(valuesTitleUkResolved)
        setValuesTitleEn(valuesTitleEnResolved)
        const nextValues = withValuesUiKeys(valuesItemsResolved, undefined)
        setValuesItems(nextValues)
        setValuesCollapsedByKey(
          collapsedArrayToMap(
            nextValues.map((b) => b.__key),
            readCollapsedBooleanArray(`rise-admin:content:${pageKey}:accordion-values`),
            true,
          ),
        )
        const teamMembersResolved = enableTeamSection
          ? resolveTeamMembers(data.teamMembers, defaultTeamMembers)
          : []
        const teamTitleUkResolved = enableTeamSection
          ? resolveValuesTitle(data.teamTitleUk, defaultTeamTitleUk ?? '')
          : ''
        const teamTitleEnResolved = enableTeamSection
          ? resolveValuesTitle(data.teamTitleEn, defaultTeamTitleEn ?? '')
          : ''
        setTeamTitleUk(teamTitleUkResolved)
        setTeamTitleEn(teamTitleEnResolved)
        const nextTeam = withTeamUiKeys(teamMembersResolved, undefined)
        setTeamMembers(nextTeam)
        setTeamCollapsedByKey(
          collapsedArrayToMap(
            nextTeam.map((b) => b.__key),
            readCollapsedBooleanArray(`rise-admin:content:${pageKey}:accordion-team`),
            true,
          ),
        )
        const volunteerPhotosResolved = enableVolunteersSection ? resolveVolunteerPhotos(data.volunteerPhotos) : []
        const volunteerTitleUkResolved = enableVolunteersSection
          ? resolveValuesTitle(data.volunteerTitleUk, defaultVolunteerTitleUk ?? '')
          : ''
        const volunteerTitleEnResolved = enableVolunteersSection
          ? resolveValuesTitle(data.volunteerTitleEn, defaultVolunteerTitleEn ?? '')
          : ''
        setVolunteerTitleUk(volunteerTitleUkResolved)
        setVolunteerTitleEn(volunteerTitleEnResolved)
        setVolunteerPhotos(withVolunteerUiKeys(volunteerPhotosResolved, undefined))
        initialRef.current = JSON.stringify({
          titleUk: data.titleUk?.toString() || defaultTitle,
          titleEn: data.titleEn?.toString() || '',
          contentUk: data.contentUk?.toString() || '',
          contentEn: data.contentEn?.toString() || '',
          blocks: Array.isArray(data.blocks) ? (data.blocks as any) : [],
          afterBlocks: afterResolved,
          valuesTitleUk: valuesTitleUkResolved,
          valuesTitleEn: valuesTitleEnResolved,
          valuesItems: valuesItemsResolved,
          teamTitleUk: teamTitleUkResolved,
          teamTitleEn: teamTitleEnResolved,
          teamMembers: teamMembersResolved,
          volunteerTitleUk: volunteerTitleUkResolved,
          volunteerTitleEn: volunteerTitleEnResolved,
          volunteerPhotos: volunteerPhotosResolved,
        })
      } catch {
        if (cancelled) return
        const afterResolved = enableAfterBlocks ? resolveAfterBlocks([], defaultAfterBlocks) : []
        const valuesItemsResolved = enableValuesSection ? resolveValuesItems([], defaultValuesItems) : []
        const valuesTitleUkResolved = enableValuesSection ? resolveValuesTitle(undefined, defaultValuesTitleUk ?? '') : ''
        const valuesTitleEnResolved = enableValuesSection ? resolveValuesTitle(undefined, defaultValuesTitleEn ?? '') : ''
        setTitleUk(defaultTitle)
        setTitleEn(defaultTitleEn ?? '')
        const fallbackUk = defaultContentUk ?? ''
        const fallbackEn = defaultContentEn ?? ''
        setContentUk(fallbackUk)
        setContentEn(fallbackEn)
        setCoverImageUrl(null)
        setCollapsedByKey({})
        setBlocks([])
        const nextAfterCatch = withAfterUiKeys(afterResolved, undefined)
        setAfterBlocks(nextAfterCatch)
        setAfterCollapsedByKey(
          collapsedArrayToMap(
            nextAfterCatch.map((b) => b.__key),
            readCollapsedBooleanArray(`rise-admin:content:${pageKey}:accordion-after`),
            true,
          ),
        )
        setValuesTitleUk(valuesTitleUkResolved)
        setValuesTitleEn(valuesTitleEnResolved)
        const nextValuesCatch = withValuesUiKeys(valuesItemsResolved, undefined)
        setValuesItems(nextValuesCatch)
        setValuesCollapsedByKey(
          collapsedArrayToMap(
            nextValuesCatch.map((b) => b.__key),
            readCollapsedBooleanArray(`rise-admin:content:${pageKey}:accordion-values`),
            true,
          ),
        )
        const teamMembersResolved = enableTeamSection ? resolveTeamMembers([], defaultTeamMembers) : []
        const teamTitleUkResolved = enableTeamSection ? resolveValuesTitle(undefined, defaultTeamTitleUk ?? '') : ''
        const teamTitleEnResolved = enableTeamSection ? resolveValuesTitle(undefined, defaultTeamTitleEn ?? '') : ''
        setTeamTitleUk(teamTitleUkResolved)
        setTeamTitleEn(teamTitleEnResolved)
        const nextTeamCatch = withTeamUiKeys(teamMembersResolved, undefined)
        setTeamMembers(nextTeamCatch)
        setTeamCollapsedByKey(
          collapsedArrayToMap(
            nextTeamCatch.map((b) => b.__key),
            readCollapsedBooleanArray(`rise-admin:content:${pageKey}:accordion-team`),
            true,
          ),
        )
        const volunteerPhotosResolved = enableVolunteersSection ? [] : []
        const volunteerTitleUkResolved = enableVolunteersSection
          ? resolveValuesTitle(undefined, defaultVolunteerTitleUk ?? '')
          : ''
        const volunteerTitleEnResolved = enableVolunteersSection
          ? resolveValuesTitle(undefined, defaultVolunteerTitleEn ?? '')
          : ''
        setVolunteerTitleUk(volunteerTitleUkResolved)
        setVolunteerTitleEn(volunteerTitleEnResolved)
        setVolunteerPhotos(withVolunteerUiKeys(volunteerPhotosResolved, undefined))
        initialRef.current = JSON.stringify({
          titleUk: defaultTitle,
          titleEn: defaultTitleEn ?? '',
          contentUk: fallbackUk,
          contentEn: fallbackEn,
          blocks: [],
          afterBlocks: afterResolved,
          valuesTitleUk: valuesTitleUkResolved,
          valuesTitleEn: valuesTitleEnResolved,
          valuesItems: valuesItemsResolved,
          teamTitleUk: teamTitleUkResolved,
          teamTitleEn: teamTitleEnResolved,
          teamMembers: teamMembersResolved,
          volunteerTitleUk: volunteerTitleUkResolved,
          volunteerTitleEn: volunteerTitleEnResolved,
          volunteerPhotos: volunteerPhotosResolved,
        })
      } finally {
        if (!cancelled) {
          setAccordionHydratedForPageKey(pageKey)
          setLoading(false)
        }
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [
    pageKey,
    defaultTitle,
    enableAfterBlocks,
    defaultAfterBlocks,
    enableValuesSection,
    defaultValuesItems,
    defaultValuesTitleUk,
    defaultValuesTitleEn,
    enableTeamSection,
    defaultTeamMembers,
    defaultTeamTitleUk,
    defaultTeamTitleEn,
    enableVolunteersSection,
    defaultVolunteerTitleUk,
    defaultVolunteerTitleEn,
    defaultContentUk,
    defaultContentEn,
    defaultTitleEn,
  ])

  const patchJson = useMemo(
    () =>
      JSON.stringify({
        titleUk,
        titleEn,
        contentUk: enableText ? contentUk : '',
        contentEn: enableText ? contentEn : '',
        blocks: stripUiKeys(blocks),
        afterBlocks: stripAfterUiKeys(afterBlocks),
        valuesTitleUk: enableValuesSection ? valuesTitleUk : '',
        valuesTitleEn: enableValuesSection ? valuesTitleEn : '',
        valuesItems: enableValuesSection ? stripValuesUiKeys(valuesItems) : [],
        teamTitleUk: enableTeamSection ? teamTitleUk : '',
        teamTitleEn: enableTeamSection ? teamTitleEn : '',
        teamMembers: enableTeamSection ? stripTeamUiKeys(teamMembers) : [],
        volunteerTitleUk: enableVolunteersSection ? volunteerTitleUk : '',
        volunteerTitleEn: enableVolunteersSection ? volunteerTitleEn : '',
        volunteerPhotos: enableVolunteersSection ? stripVolunteerUiKeys(volunteerPhotos) : [],
      }),
    [
      titleUk,
      titleEn,
      contentUk,
      contentEn,
      blocks,
      afterBlocks,
      valuesTitleUk,
      valuesTitleEn,
      valuesItems,
      teamTitleUk,
      teamTitleEn,
      teamMembers,
      volunteerTitleUk,
      volunteerTitleEn,
      volunteerPhotos,
      enableText,
      enableValuesSection,
      enableTeamSection,
      enableVolunteersSection,
    ],
  )

  const dirty = patchJson !== initialRef.current

  async function save(opts?: { silent?: boolean }) {
    const silent = opts?.silent === true
    if (silent && patchJson === initialRef.current) return
    if (!silent) setSaving(true)
    if (!silent) setError(null)
    try {
      const updated = await apiFetch<ContentPage>(`/content/${pageKey}`, {
        method: 'PATCH',
        json: {
          titleUk,
          titleEn,
          ...(enableText ? { contentUk, contentEn } : {}),
          ...(enableBlocks ? { blocks: stripUiKeys(blocks) } : {}),
          ...(enableAfterBlocks ? { afterBlocks: stripAfterUiKeys(afterBlocks) } : {}),
          ...(enableValuesSection
            ? {
                valuesTitleUk,
                valuesTitleEn,
                valuesItems: stripValuesUiKeys(valuesItems),
              }
            : {}),
          ...(enableTeamSection
            ? {
                teamTitleUk,
                teamTitleEn,
                teamMembers: stripTeamUiKeys(teamMembers),
              }
            : {}),
          ...(enableVolunteersSection
            ? {
                volunteerTitleUk,
                volunteerTitleEn,
                volunteerPhotos: stripVolunteerUiKeys(volunteerPhotos),
              }
            : {}),
        },
      })
      setTitleUk(updated.titleUk?.toString() || titleUk)
      setTitleEn(updated.titleEn?.toString() || titleEn)
      if (enableText) {
        setContentUk(updated.contentUk?.toString() || contentUk)
        setContentEn(updated.contentEn?.toString() || contentEn)
      }
      setBlocks((prev) =>
        withUiKeys(Array.isArray(updated.blocks) ? (updated.blocks as any) : stripUiKeys(prev), prev),
      )
      setAfterBlocks((prev) =>
        withAfterUiKeys(
          Array.isArray(updated.afterBlocks) ? (updated.afterBlocks as any) : stripAfterUiKeys(prev),
          prev,
        ),
      )
      setValuesTitleUk(
        enableValuesSection ? (updated as any).valuesTitleUk?.toString?.() ?? valuesTitleUk : valuesTitleUk,
      )
      setValuesTitleEn(
        enableValuesSection ? (updated as any).valuesTitleEn?.toString?.() ?? valuesTitleEn : valuesTitleEn,
      )
      setValuesItems((prev) =>
        enableValuesSection
          ? withValuesUiKeys(
              Array.isArray((updated as any).valuesItems)
                ? ((updated as any).valuesItems as any)
                : stripValuesUiKeys(prev),
              prev,
            )
          : prev,
      )
      setTeamTitleUk(
        enableTeamSection ? (updated as any).teamTitleUk?.toString?.() ?? teamTitleUk : teamTitleUk,
      )
      setTeamTitleEn(
        enableTeamSection ? (updated as any).teamTitleEn?.toString?.() ?? teamTitleEn : teamTitleEn,
      )
      setTeamMembers((prev) =>
        enableTeamSection
          ? withTeamUiKeys(
              Array.isArray((updated as any).teamMembers)
                ? ((updated as any).teamMembers as any)
                : stripTeamUiKeys(prev),
              prev,
            )
          : prev,
      )
      setVolunteerTitleUk(
        enableVolunteersSection
          ? (updated as any).volunteerTitleUk?.toString?.() ?? volunteerTitleUk
          : volunteerTitleUk,
      )
      setVolunteerTitleEn(
        enableVolunteersSection
          ? (updated as any).volunteerTitleEn?.toString?.() ?? volunteerTitleEn
          : volunteerTitleEn,
      )
      setVolunteerPhotos((prev) =>
        enableVolunteersSection
          ? withVolunteerUiKeys(
              Array.isArray((updated as any).volunteerPhotos)
                ? ((updated as any).volunteerPhotos as any)
                : stripVolunteerUiKeys(prev),
              prev,
            )
          : prev,
      )
      initialRef.current = JSON.stringify({
        titleUk: updated.titleUk?.toString() || titleUk,
        titleEn: updated.titleEn?.toString() || titleEn,
        contentUk: enableText ? (updated.contentUk?.toString() || contentUk) : '',
        contentEn: enableText ? (updated.contentEn?.toString() || contentEn) : '',
        blocks: Array.isArray(updated.blocks) ? (updated.blocks as any) : stripUiKeys(blocks),
        afterBlocks: Array.isArray(updated.afterBlocks) ? (updated.afterBlocks as any) : stripAfterUiKeys(afterBlocks),
        valuesTitleUk: enableValuesSection
          ? ((updated as any).valuesTitleUk?.toString?.() ?? valuesTitleUk)
          : '',
        valuesTitleEn: enableValuesSection
          ? ((updated as any).valuesTitleEn?.toString?.() ?? valuesTitleEn)
          : '',
        valuesItems: enableValuesSection
          ? Array.isArray((updated as any).valuesItems)
            ? (updated as any).valuesItems
            : stripValuesUiKeys(valuesItems)
          : [],
        teamTitleUk: enableTeamSection
          ? ((updated as any).teamTitleUk?.toString?.() ?? teamTitleUk)
          : '',
        teamTitleEn: enableTeamSection
          ? ((updated as any).teamTitleEn?.toString?.() ?? teamTitleEn)
          : '',
        teamMembers: enableTeamSection
          ? Array.isArray((updated as any).teamMembers)
            ? (updated as any).teamMembers
            : stripTeamUiKeys(teamMembers)
          : [],
        volunteerTitleUk: enableVolunteersSection
          ? ((updated as any).volunteerTitleUk?.toString?.() ?? volunteerTitleUk)
          : '',
        volunteerTitleEn: enableVolunteersSection
          ? ((updated as any).volunteerTitleEn?.toString?.() ?? volunteerTitleEn)
          : '',
        volunteerPhotos: enableVolunteersSection
          ? Array.isArray((updated as any).volunteerPhotos)
            ? (updated as any).volunteerPhotos
            : stripVolunteerUiKeys(volunteerPhotos)
          : [],
      })
      if (!silent) toastSuccess('Збережено', 'Контент оновлено.')
    } catch (e) {
      if (!silent) {
        if (e instanceof ApiError) setError('Не вдалося зберегти.')
        else setError('Помилка. Спробуй ще раз.')
        toastError('Помилка', 'Не вдалося зберегти.')
      }
      throw e
    } finally {
      if (!silent) setSaving(false)
    }
  }

  usePersistedJsonAutosave({
    loading,
    isDirty: dirty,
    patchJson,
    saveSilent: () => save({ silent: true }),
  })

  async function onUploadCover(file: File | null) {
    if (!file) return
    setUploadingCover(true)
    setError(null)
    try {
      const form = new FormData()
      form.append('image', file)
      const updated = await apiFetch<ContentPage>(`/content/${pageKey}/cover`, {
        method: 'POST',
        body: form,
      })
      setCoverImageUrl((updated.coverImageUrl ?? null) as any)
      toastSuccess('Завантажено', 'Головна картинка оновлена.')
    } catch {
      setError('Не вдалося завантажити картинку.')
      toastError('Помилка', 'Не вдалося завантажити картинку.')
    } finally {
      setUploadingCover(false)
      if (coverInputRef.current) coverInputRef.current.value = ''
    }
  }

  async function onUploadBlockImage(blockIndex: number, file: File | null) {
    if (!file) return
    try {
      if (dirty) {
        await save({ silent: true })
      }
      const form = new FormData()
      form.append('image', file)
      const updated = await apiFetch<ContentPage>(
        `/content/${pageKey}/blocks/image?blockIndex=${encodeURIComponent(String(blockIndex))}`,
        {
          method: 'POST',
          body: form,
        },
      )
      setBlocks((prev) => withUiKeys(Array.isArray(updated.blocks) ? (updated.blocks as any) : stripUiKeys(prev), prev))
      toastSuccess('Завантажено', 'Картинка блоку оновлена.')
    } catch {
      toastError('Помилка', 'Не вдалося завантажити картинку блоку.')
    } finally {
      const ref = blockInputRefs.current[blockIndex]
      if (ref) ref.value = ''
    }
  }

  async function onDeleteTeamMemberImage(memberIndex: number) {
    setTeamImageBusy({ index: memberIndex, mode: 'delete' })
    try {
      if (dirty) {
        await save({ silent: true })
      }
      const updated = await apiFetch<ContentPage>(
        `/content/${pageKey}/team/image?memberIndex=${encodeURIComponent(String(memberIndex))}`,
        { method: 'DELETE' },
      )
      let members = Array.isArray((updated as any).teamMembers)
        ? (([...(updated as any).teamMembers] as unknown[]) as NonNullable<ContentPage['teamMembers']>)
        : stripTeamUiKeys(teamMembers)
      while (members.length <= memberIndex) {
        members.push({ nameUk: '', nameEn: '', roleUk: '', roleEn: '', imageUrl: null })
      }
      members = members.map((x, i) => (i === memberIndex ? { ...x, imageUrl: null } : x))
      setTeamMembers((prev) => withTeamUiKeys(members, prev))
      try {
        const cur = JSON.parse(initialRef.current) as Record<string, unknown>
        cur.teamMembers = members
        initialRef.current = JSON.stringify(cur)
      } catch {
        /* ignore */
      }
      toastSuccess('Видалено', 'Фото знято з картки та з сервера.')
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Не вдалося видалити фото.'
      toastError('Помилка', msg)
    } finally {
      setTeamImageBusy(null)
    }
  }

  async function onUploadTeamMemberImage(memberIndex: number, file: File | null) {
    if (!file) return
    setTeamImageBusy({ index: memberIndex, mode: 'upload' })
    try {
      if (dirty) {
        await save({ silent: true })
      }
      const form = new FormData()
      form.append('image', file)
      const updated = await apiFetch<ContentPage>(
        `/content/${pageKey}/team/image?memberIndex=${encodeURIComponent(String(memberIndex))}`,
        {
          method: 'POST',
          body: form,
        },
      )
      let members = Array.isArray((updated as any).teamMembers)
        ? (([...(updated as any).teamMembers] as unknown[]) as NonNullable<ContentPage['teamMembers']>)
        : stripTeamUiKeys(teamMembers)
      while (members.length <= memberIndex) {
        members.push({ nameUk: '', nameEn: '', roleUk: '', roleEn: '', imageUrl: null })
      }
      if (!members[memberIndex]?.imageUrl) {
        const ext = extFromFileName(file.name)
        const imageUrl = `/uploads/content/${pageKey}/${pageKey}_team_image${memberIndex + 1}${ext}`
        members = members.map((x, i) => (i === memberIndex ? { ...x, imageUrl } : x))
      }
      setTeamMembers((prev) => withTeamUiKeys(members, prev))
      try {
        const cur = JSON.parse(initialRef.current) as Record<string, unknown>
        cur.teamMembers = members
        initialRef.current = JSON.stringify(cur)
      } catch {
        /* ignore */
      }
      toastSuccess('Завантажено', 'Фото оновлено.')
    } catch (e) {
      const msg =
        e instanceof ApiError && e.status === 413
          ? 'Файл завеликий (ліміт nginx). Збільште client_max_body_size для API.'
          : e instanceof ApiError
            ? e.message
            : 'Не вдалося завантажити фото.'
      toastError('Помилка', msg)
    } finally {
      setTeamImageBusy(null)
      const ref = teamInputRefs.current[memberIndex]
      if (ref) ref.value = ''
    }
  }

  async function onUploadVolunteerPhoto(photoIndex: number, file: File | null) {
    if (!file) return
    try {
      if (dirty) {
        await save({ silent: true })
      }
      const form = new FormData()
      form.append('image', file)
      const updated = await apiFetch<ContentPage>(
        `/content/${pageKey}/volunteers/image?photoIndex=${encodeURIComponent(String(photoIndex))}`,
        {
          method: 'POST',
          body: form,
        },
      )
      setVolunteerPhotos((prev) =>
        withVolunteerUiKeys(
          Array.isArray((updated as any).volunteerPhotos)
            ? ((updated as any).volunteerPhotos as any)
            : stripVolunteerUiKeys(prev),
          prev,
        ),
      )
      toastSuccess('Завантажено', 'Фото оновлено.')
    } catch {
      toastError('Помилка', 'Не вдалося завантажити фото.')
    } finally {
      const ref = volunteerInputRefs.current[photoIndex]
      if (ref) ref.value = ''
    }
  }

  if (loading) {
    return <div className="text-sm text-[hsl(var(--muted-foreground))]">Loading…</div>
  }

  return (
    <div className={`mx-auto max-w-4xl space-y-6 ${loading ? '' : 'pb-28'}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[hsl(var(--foreground))]">{pageHeading}</h1>
          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">{pageDescription}</p>
        </div>
        {dirty ? (
          <Button type="button" disabled={saving} onClick={() => void save()}>
            {saving ? 'Зберігаю…' : 'Зберегти'}
          </Button>
        ) : null}
      </div>

      <Card className="bg-[hsl(var(--card)/0.65)] backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-3">
            <span>Контент</span>
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
        </CardHeader>
        <CardContent className="grid gap-4">
          {enableCover ? (
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
              {coverImageUrl ? (
                <div className="overflow-hidden rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card)/0.4)]">
                  <img
                    src={`${API_BASE_URL.replace(/\/api$/, '')}${coverImageUrl}`}
                    alt=""
                    className="aspect-[21/7] w-full object-cover"
                    loading="lazy"
                  />
                </div>
              ) : null}
            </div>
          ) : null}
          <div className="grid gap-2">
            <Label>Заголовок</Label>
            <Input
              value={lang === 'uk' ? titleUk : titleEn}
              onChange={(e) => (lang === 'uk' ? setTitleUk(e.target.value) : setTitleEn(e.target.value))}
            />
          </div>
          {enableText ? (
            <div className="grid gap-2">
              <Label>Текст</Label>
              <RichTextEditor
                value={lang === 'uk' ? contentUk : contentEn}
                onChange={(html) => (lang === 'uk' ? setContentUk(html) : setContentEn(html))}
                placeholder={placeholder ?? 'Встав текст…'}
                minHeightClassName="min-h-[520px]"
              />
            </div>
          ) : null}

          {enableBlocks ? (
            <div className="grid gap-2">
              <Label>Блоки (для слайдера)</Label>
              <div className="space-y-3">
                {blocks.length === 0 ? (
                  <div className="text-sm text-[hsl(var(--muted-foreground))]">Блоків ще немає.</div>
                ) : null}
                {blocks.map((b, idx) => {
                  const imageUrl = (b.imageUrl ?? null) as any
                  const origin = API_BASE_URL.replace(/\/api$/, '')
                  const src = imageUrl ? (imageUrl.startsWith('http') ? imageUrl : `${origin}${imageUrl}`) : null
                  const collapsed = collapsedByKey[b.__key] ?? true
                  return (
                    <div
                      key={b.__key}
                      className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card)/0.4)] p-4"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--foreground))]"
                            aria-label={collapsed ? 'Expand block' : 'Collapse block'}
                            title={collapsed ? 'Розгорнути' : 'Згорнути'}
                            onClick={() => toggleCollapsed(b.__key)}
                          >
                            <ChevronDown className={cn('h-4 w-4 transition-transform', collapsed ? '-rotate-90' : 'rotate-0')} />
                          </button>
                          <div className="text-xs font-medium text-[hsl(var(--muted-foreground))]">{idx + 1}. block</div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-9 w-9 px-0"
                          aria-label="Remove block"
                          title="Remove"
                          onClick={() => setBlocks((prev) => prev.filter((_, i) => i !== idx))}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className={cn('mt-3 grid gap-2', collapsed ? 'hidden' : '')}>
                        <Label>Опис</Label>
                        <RichTextEditor
                          value={lang === 'uk' ? (b.excerptUk ?? '') : (b.excerptEn ?? '')}
                          onChange={(html) =>
                            setBlocks((prev) =>
                              prev.map((x, i) =>
                                i === idx
                                  ? {
                                      ...x,
                                      ...(lang === 'uk'
                                        ? { excerptUk: html }
                                        : { excerptEn: html }),
                                    }
                                  : x,
                              ),
                            )
                          }
                          placeholder="Опис…"
                          minHeightClassName="min-h-[160px]"
                        />

                        <div className="flex items-center gap-3">
                          <input
                            ref={(el) => {
                              blockInputRefs.current[idx] = el
                            }}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => void onUploadBlockImage(idx, e.target.files?.[0] ?? null)}
                          />
                          <Button type="button" variant="secondary" size="sm" onClick={() => blockInputRefs.current[idx]?.click()}>
                            Картинка
                          </Button>
                          <div className="text-xs text-[hsl(var(--muted-foreground))]">
                            {imageUrl ? 'Завантажено' : 'Файл не вибран'}
                          </div>
                        </div>

                        {src ? (
                          <div className="overflow-hidden rounded-lg border border-[hsl(var(--border))]">
                            <img src={src} alt="" className="aspect-[21/9] w-full object-cover" loading="lazy" />
                          </div>
                        ) : null}
                      </div>
                    </div>
                  )
                })}
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  const nextKey = crypto.randomUUID()
                  setCollapsedByKey((m) => {
                    const next: Record<string, boolean> = {}
                    for (const b of blocks) next[b.__key] = true
                    next[nextKey] = false
                    return { ...m, ...next }
                  })
                  setBlocks((prev) => [
                    ...prev,
                    { __key: nextKey, titleUk: '', titleEn: '', excerptUk: '', excerptEn: '', imageUrl: null },
                  ])
                }}
              >
                Додати блок
              </Button>
            </div>
          ) : null}

          {enableAfterBlocks ? (
            <div className="grid gap-2">
              <Label>Блоки (Місія та Візія)</Label>
              <div className="space-y-3">
                {afterBlocks.length === 0 ? (
                  <div className="text-sm text-[hsl(var(--muted-foreground))]">Блоків ще немає.</div>
                ) : null}
                {afterBlocks.map((b, idx) => {
                  const collapsed = afterCollapsedByKey[b.__key] ?? true
                  return (
                    <div
                      key={b.__key}
                      className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card)/0.4)] p-4"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--foreground))]"
                            aria-label={collapsed ? 'Expand block' : 'Collapse block'}
                            title={collapsed ? 'Розгорнути' : 'Згорнути'}
                            onClick={() => toggleAfterCollapsed(b.__key)}
                          >
                            <ChevronDown className={cn('h-4 w-4 transition-transform', collapsed ? '-rotate-90' : 'rotate-0')} />
                          </button>
                          <div className="text-xs font-medium text-[hsl(var(--muted-foreground))]">{idx + 1}. block</div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-9 w-9 px-0"
                          aria-label="Remove block"
                          title="Remove"
                          onClick={() => setAfterBlocks((prev) => prev.filter((_, i) => i !== idx))}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className={cn('mt-3 grid gap-2', collapsed ? 'hidden' : '')}>
                        <div className="grid gap-2">
                          <Label>Заголовок блоку</Label>
                          <Input
                            value={lang === 'uk' ? (b.titleUk ?? '') : (b.titleEn ?? '')}
                            onChange={(e) =>
                              setAfterBlocks((prev) =>
                                prev.map((x, i) =>
                                  i === idx
                                    ? { ...x, ...(lang === 'uk' ? { titleUk: e.target.value } : { titleEn: e.target.value }) }
                                    : x,
                                ),
                              )
                            }
                          />
                        </div>

                        <Label>Опис</Label>
                        <RichTextEditor
                          value={lang === 'uk' ? (b.excerptUk ?? '') : (b.excerptEn ?? '')}
                          onChange={(html) =>
                            setAfterBlocks((prev) =>
                              prev.map((x, i) =>
                                i === idx
                                  ? {
                                      ...x,
                                      ...(lang === 'uk' ? { excerptUk: html } : { excerptEn: html }),
                                    }
                                  : x,
                              ),
                            )
                          }
                          placeholder="Опис…"
                          minHeightClassName="min-h-[160px]"
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  const nextKey = crypto.randomUUID()
                  setAfterCollapsedByKey((m) => {
                    const next: Record<string, boolean> = {}
                    for (const b of afterBlocks) next[b.__key] = true
                    next[nextKey] = false
                    return { ...m, ...next }
                  })
                  setAfterBlocks((prev) => [
                    ...prev,
                    { __key: nextKey, titleUk: '', titleEn: '', excerptUk: '', excerptEn: '' },
                  ])
                }}
              >
                Додати блок
              </Button>
            </div>
          ) : null}

          {enableValuesSection ? (
            <div className="grid gap-3 border-t border-[hsl(var(--border))] pt-6">
              <Label>Наші цінності — заголовок секції</Label>
              <Input
                value={lang === 'uk' ? valuesTitleUk : valuesTitleEn}
                onChange={(e) =>
                  lang === 'uk' ? setValuesTitleUk(e.target.value) : setValuesTitleEn(e.target.value)
                }
                placeholder={lang === 'uk' ? 'Наші цінності' : 'Our values'}
              />
              <Label className="mt-2">Цінності (кола)</Label>
              <div className="space-y-3">
                {valuesItems.length === 0 ? (
                  <div className="text-sm text-[hsl(var(--muted-foreground))]">Елементів ще немає.</div>
                ) : null}
                {valuesItems.map((b, idx) => {
                  const collapsed = valuesCollapsedByKey[b.__key] ?? true
                  const size = b.size ?? 'md'
                  const variant = b.variant ?? 'blue'
                  const slot = typeof b.slot === 'number' ? b.slot : 0
                  return (
                    <div
                      key={b.__key}
                      className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card)/0.4)] p-4"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--foreground))]"
                            aria-label={collapsed ? 'Expand' : 'Collapse'}
                            title={collapsed ? 'Розгорнути' : 'Згорнути'}
                            onClick={() => toggleValuesCollapsed(b.__key)}
                          >
                            <ChevronDown
                              className={cn('h-4 w-4 transition-transform', collapsed ? '-rotate-90' : 'rotate-0')}
                            />
                          </button>
                          <div className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
                            {idx + 1}.{' '}
                            {(lang === 'uk' ? b.titleUk : b.titleEn)?.trim() || 'цінність'}
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-9 w-9 px-0"
                          aria-label="Remove"
                          onClick={() => setValuesItems((prev) => prev.filter((_, i) => i !== idx))}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className={cn('mt-3 grid gap-2', collapsed ? 'hidden' : '')}>
                        <div className="grid gap-2">
                          <Label>Заголовок</Label>
                          <Input
                            value={lang === 'uk' ? (b.titleUk ?? '') : (b.titleEn ?? '')}
                            onChange={(e) =>
                              setValuesItems((prev) =>
                                prev.map((x, i) =>
                                  i === idx
                                    ? {
                                        ...x,
                                        ...(lang === 'uk' ? { titleUk: e.target.value } : { titleEn: e.target.value }),
                                      }
                                    : x,
                                ),
                              )
                            }
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label>Опис</Label>
                          <Textarea
                            value={lang === 'uk' ? (b.descriptionUk ?? '') : (b.descriptionEn ?? '')}
                            onChange={(e) =>
                              setValuesItems((prev) =>
                                prev.map((x, i) =>
                                  i === idx
                                    ? {
                                        ...x,
                                        ...(lang === 'uk'
                                          ? { descriptionUk: e.target.value }
                                          : { descriptionEn: e.target.value }),
                                      }
                                    : x,
                                ),
                              )
                            }
                            rows={4}
                            className="min-h-[100px]"
                          />
                        </div>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                          <div className="grid gap-1">
                            <Label className="text-xs">Розмір</Label>
                            <select
                              className="h-9 rounded-md border border-[hsl(var(--input))] bg-transparent px-2 text-sm text-[hsl(var(--foreground))]"
                              value={size}
                              onChange={(e) => {
                                const v = e.target.value as 'sm' | 'md' | 'lg' | 'xl'
                                setValuesItems((prev) =>
                                  prev.map((x, i) => (i === idx ? { ...x, size: v } : x)),
                                )
                              }}
                            >
                              <option value="sm">Малий</option>
                              <option value="md">Середній</option>
                              <option value="lg">Великий</option>
                              <option value="xl">Найбільший</option>
                            </select>
                          </div>
                          <div className="grid gap-1">
                            <Label className="text-xs">Колір</Label>
                            <select
                              className="h-9 rounded-md border border-[hsl(var(--input))] bg-transparent px-2 text-sm text-[hsl(var(--foreground))]"
                              value={variant}
                              onChange={(e) => {
                                const v = e.target.value as 'blue' | 'gold'
                                setValuesItems((prev) =>
                                  prev.map((x, i) => (i === idx ? { ...x, variant: v } : x)),
                                )
                              }}
                            >
                              <option value="blue">Блакитний градієнт</option>
                              <option value="gold">Золотий градієнт</option>
                            </select>
                          </div>
                          <div className="grid gap-1">
                            <Label className="text-xs">Слот (позиція 0–7)</Label>
                            <select
                              className="h-9 rounded-md border border-[hsl(var(--input))] bg-transparent px-2 text-sm text-[hsl(var(--foreground))]"
                              value={String(slot)}
                              onChange={(e) => {
                                const n = Number(e.target.value)
                                setValuesItems((prev) =>
                                  prev.map((x, i) => (i === idx ? { ...x, slot: n } : x)),
                                )
                              }}
                            >
                              {[0, 1, 2, 3, 4, 5, 6, 7].map((n) => (
                                <option key={n} value={String(n)}>
                                  {n}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  const nextKey = crypto.randomUUID()
                  setValuesCollapsedByKey((m) => {
                    const next: Record<string, boolean> = {}
                    for (const b of valuesItems) next[b.__key] = true
                    next[nextKey] = false
                    return { ...m, ...next }
                  })
                  setValuesItems((prev) => [
                    ...prev,
                    {
                      __key: nextKey,
                      titleUk: '',
                      titleEn: '',
                      descriptionUk: '',
                      descriptionEn: '',
                      size: 'md',
                      variant: 'blue',
                      slot: prev.length % 8,
                    },
                  ])
                }}
              >
                Додати цінність
              </Button>
            </div>
          ) : null}

          {enableTeamSection ? (
            <div className="grid gap-3 border-t border-[hsl(var(--border))] pt-6">
              <Label>Наша команда — заголовок секції</Label>
              <Input
                value={lang === 'uk' ? teamTitleUk : teamTitleEn}
                onChange={(e) =>
                  lang === 'uk' ? setTeamTitleUk(e.target.value) : setTeamTitleEn(e.target.value)
                }
                placeholder={lang === 'uk' ? 'Наша команда' : 'Our team'}
              />
              <Label className="mt-2">Учасники (слайдер)</Label>
              <div className="space-y-3">
                {teamMembers.length === 0 ? (
                  <div className="text-sm text-[hsl(var(--muted-foreground))]">Учасників ще немає.</div>
                ) : null}
                {teamMembers.map((m, idx) => {
                  const collapsed = teamCollapsedByKey[m.__key] ?? true
                  const imageUrl = (m.imageUrl ?? null) as any
                  const origin = API_BASE_URL.replace(/\/api$/, '')
                  const src = imageUrl ? (imageUrl.startsWith('http') ? imageUrl : `${origin}${imageUrl}`) : null
                  return (
                    <div
                      key={m.__key}
                      className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card)/0.4)] p-4"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--foreground))]"
                            aria-label={collapsed ? 'Expand' : 'Collapse'}
                            title={collapsed ? 'Розгорнути' : 'Згорнути'}
                            onClick={() => toggleTeamCollapsed(m.__key)}
                          >
                            <ChevronDown
                              className={cn('h-4 w-4 transition-transform', collapsed ? '-rotate-90' : 'rotate-0')}
                            />
                          </button>
                          <div className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
                            {idx + 1}.{' '}
                            {(lang === 'uk' ? m.nameUk : m.nameEn)?.trim() || 'учасник'}
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-9 w-9 px-0"
                          aria-label="Remove"
                          onClick={() => setTeamMembers((prev) => prev.filter((_, i) => i !== idx))}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className={cn('mt-3', collapsed ? 'hidden' : '')}>
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                          <div className="flex w-full shrink-0 flex-col items-center gap-2 sm:w-[112px]">
                            {src ? (
                              <div className="group relative aspect-[3/4] w-full max-w-[112px] overflow-hidden rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.2)]">
                                <img
                                  src={src}
                                  alt=""
                                  className="h-full w-full object-cover transition group-hover:brightness-[0.92]"
                                  loading="lazy"
                                />
                                <button
                                  type="button"
                                  className="absolute right-1 top-1 z-10 rounded-full bg-[hsl(var(--background))]/95 p-1.5 text-[hsl(var(--destructive))] shadow-md ring-1 ring-[hsl(var(--border))] transition hover:bg-[hsl(var(--accent))] disabled:opacity-50 group-hover:scale-105"
                                  aria-label="Видалити фото"
                                  title="Видалити фото"
                                  disabled={teamImageBusy?.index === idx}
                                  onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    void onDeleteTeamMemberImage(idx)
                                  }}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ) : (
                              <div
                                className="flex aspect-[3/4] w-full max-w-[112px] flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.25)] px-1 py-2 text-[hsl(var(--muted-foreground))]"
                                aria-hidden
                              >
                                <ImageIcon className="h-7 w-7 opacity-45" />
                                <span className="text-center text-[10px] leading-tight">Немає фото</span>
                              </div>
                            )}
                            <input
                              ref={(el) => {
                                teamInputRefs.current[idx] = el
                              }}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => void onUploadTeamMemberImage(idx, e.target.files?.[0] ?? null)}
                            />
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              className="w-full max-w-[112px]"
                              disabled={teamImageBusy?.index === idx}
                              onClick={() => teamInputRefs.current[idx]?.click()}
                            >
                              Фото
                            </Button>
                            <div className="text-center text-[10px] text-[hsl(var(--muted-foreground))]">
                              {teamImageBusy?.index === idx
                                ? teamImageBusy.mode === 'delete'
                                  ? 'Видалення…'
                                  : 'Завантаження…'
                                : imageUrl
                                  ? 'Завантажено'
                                  : 'Файл не вибрано'}
                            </div>
                          </div>
                          <div className="min-w-0 flex-1 space-y-3">
                            <div className="grid gap-2">
                              <Label>Імʼя</Label>
                              <Input
                                value={lang === 'uk' ? (m.nameUk ?? '') : (m.nameEn ?? '')}
                                onChange={(e) =>
                                  setTeamMembers((prev) =>
                                    prev.map((x, i) =>
                                      i === idx
                                        ? {
                                            ...x,
                                            ...(lang === 'uk' ? { nameUk: e.target.value } : { nameEn: e.target.value }),
                                          }
                                        : x,
                                    ),
                                  )
                                }
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label>Посада / роль</Label>
                              <Textarea
                                value={lang === 'uk' ? (m.roleUk ?? '') : (m.roleEn ?? '')}
                                onChange={(e) =>
                                  setTeamMembers((prev) =>
                                    prev.map((x, i) =>
                                      i === idx
                                        ? {
                                            ...x,
                                            ...(lang === 'uk' ? { roleUk: e.target.value } : { roleEn: e.target.value }),
                                          }
                                        : x,
                                    ),
                                  )
                                }
                                rows={3}
                                className="min-h-[72px]"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  const nextKey = crypto.randomUUID()
                  setTeamCollapsedByKey((m) => {
                    const next: Record<string, boolean> = {}
                    for (const b of teamMembers) next[b.__key] = true
                    next[nextKey] = false
                    return { ...m, ...next }
                  })
                  setTeamMembers((prev) => [
                    ...prev,
                    {
                      __key: nextKey,
                      nameUk: '',
                      nameEn: '',
                      roleUk: '',
                      roleEn: '',
                      imageUrl: null,
                    },
                  ])
                }}
              >
                Додати учасника
              </Button>
            </div>
          ) : null}

          {enableVolunteersSection ? (
            <div className="grid gap-3 border-t border-[hsl(var(--border))] pt-6">
              <Label>Наші волонтери — заголовок секції</Label>
              <Input
                value={lang === 'uk' ? volunteerTitleUk : volunteerTitleEn}
                onChange={(e) =>
                  lang === 'uk' ? setVolunteerTitleUk(e.target.value) : setVolunteerTitleEn(e.target.value)
                }
                placeholder={lang === 'uk' ? 'Наші волонтери' : 'Our volunteers'}
              />
              <Label className="mt-2">Фото (лише зображення)</Label>
              <div className="space-y-3">
                {volunteerPhotos.length === 0 ? (
                  <div className="text-sm text-[hsl(var(--muted-foreground))]">
                    Додай слоти кнопкою «Додати фото», потім завантаж зображення для кожного.
                  </div>
                ) : null}
                {volunteerPhotos.map((p, idx) => {
                  const imageUrl = (p.imageUrl ?? null) as any
                  const origin = API_BASE_URL.replace(/\/api$/, '')
                  const src = imageUrl ? (imageUrl.startsWith('http') ? imageUrl : `${origin}${imageUrl}`) : null
                  return (
                    <div
                      key={p.__key}
                      className="flex flex-wrap items-center gap-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card)/0.4)] p-3"
                    >
                      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.3)]">
                        {src ? (
                          <img src={src} alt="" className="h-full w-full object-cover" loading="lazy" />
                        ) : (
                          <div className="flex h-full items-center justify-center text-[10px] text-[hsl(var(--muted-foreground))]">
                            —
                          </div>
                        )}
                      </div>
                      <div className="flex flex-1 flex-wrap items-center gap-2">
                        <input
                          ref={(el) => {
                            volunteerInputRefs.current[idx] = el
                          }}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => void onUploadVolunteerPhoto(idx, e.target.files?.[0] ?? null)}
                        />
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => volunteerInputRefs.current[idx]?.click()}
                        >
                          Завантажити
                        </Button>
                        <span className="text-xs text-[hsl(var(--muted-foreground))]">
                          {imageUrl ? 'Файл є' : 'Файл не вибран'}
                        </span>
                        <span className="text-xs text-[hsl(var(--muted-foreground))]">#{idx + 1}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="ml-auto h-9 w-9 px-0"
                          aria-label="Видалити слот"
                          onClick={() => setVolunteerPhotos((prev) => prev.filter((_, i) => i !== idx))}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={volunteerPhotos.length >= 20}
                onClick={() =>
                  setVolunteerPhotos((prev) => [...prev, { __key: crypto.randomUUID(), imageUrl: null }])
                }
              >
                Додати фото
              </Button>
            </div>
          ) : null}
          {error ? <p className="text-sm text-red-400">{error}</p> : null}
        </CardContent>
      </Card>

      <AdminPersistFooter saving={saving} onSave={() => void save()} disabled={saving} />
    </div>
  )
}

