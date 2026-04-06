import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { apiFetch, ApiError } from '@admin/api/http'
import type { Direction } from '@admin/types/directions'
import type { Project } from '@admin/types/projects'
import { Button } from '@admin/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@admin/components/ui/card'
import { API_BASE_URL } from '@admin/api/config'
import { toastError } from '@admin/lib/toast'

export function ProjectsListPage() {
  const [items, setItems] = useState<Project[]>([])
  const [directions, setDirections] = useState<Direction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function run() {
      try {
        const [plist, dlist] = await Promise.all([
          apiFetch<Project[]>('/projects'),
          apiFetch<Direction[]>('/directions').catch(() => [] as Direction[]),
        ])
        if (!cancelled) {
          setItems(plist)
          setDirections(dlist)
        }
      } catch (e) {
        if (!cancelled) setItems([])
        if (e instanceof ApiError && e.status === 401) return
        toastError('Помилка', 'Не вдалося завантажити список проєктів.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [])

  function directionLabel(project: Project): string | null {
    const id = project.directionId?.trim()
    if (!id) return null
    const d = directions.find((x) => x._id === id)
    return d ? (d.titleUk ?? d.title) : id
  }

  function statusLabel(project: Project): 'implemented' | 'current' | null {
    const s = project.implementationStatus
    return s === 'implemented' || s === 'current' ? s : null
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[hsl(var(--foreground))]">
            Проєкти
          </h1>
          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
            Повний контент проєкту (як раніше в «напрямках»): текст, результати, галерея.
          </p>
        </div>
        <Button asChild size="sm">
          <Link to="/projects/new">Створити</Link>
        </Button>
      </div>

      {loading ? (
        <div className="text-sm text-[hsl(var(--muted-foreground))]">Loading…</div>
      ) : items.length === 0 ? (
        <Card className="bg-[hsl(var(--card)/0.65)] backdrop-blur">
          <CardHeader>
            <CardTitle>Поки що порожньо</CardTitle>
            <CardDescription>Створи перший проєкт.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((a) => {
            const origin = API_BASE_URL.replace(/\/api$/, '')
            const coverSrc = a.coverImageUrl ? `${origin}${a.coverImageUrl}` : null
            const dirLbl = directionLabel(a)
            const status = statusLabel(a)
            const excerptRaw = (a.excerptUk ?? a.excerpt ?? '') as string
            const excerpt =
              excerptRaw.length > 160 ? `${excerptRaw.slice(0, 160).trim()}…` : excerptRaw

            return (
              <Card
                key={a._id}
                className="flex flex-col overflow-hidden border-[hsl(var(--border))] bg-[hsl(var(--card)/0.65)] shadow-sm backdrop-blur transition-shadow hover:shadow-md"
              >
                <div className="relative aspect-[5/3] shrink-0 bg-[hsl(var(--muted)/0.35)]">
                  {coverSrc ? (
                    <img
                      src={coverSrc}
                      alt=""
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center px-4 text-center text-xs font-medium text-[hsl(var(--muted-foreground))]">
                      Немає головного зображення
                    </div>
                  )}
                </div>

                <CardContent className="flex flex-1 flex-col gap-3 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    {dirLbl ? (
                      <span className="inline-flex max-w-full items-center rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.25)] px-2.5 py-0.5 text-[11px] font-medium text-[hsl(var(--foreground))]">
                        <span className="truncate">{dirLbl}</span>
                      </span>
                    ) : (
                      <span className="inline-flex rounded-full border border-dashed border-[hsl(var(--border))] px-2.5 py-0.5 text-[11px] text-[hsl(var(--muted-foreground))]">
                        Без напрямку
                      </span>
                    )}
                    {status === 'implemented' ? (
                      <span className="inline-flex rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--primary)/0.15)] px-2.5 py-0.5 text-[11px] font-medium text-[hsl(var(--foreground))]">
                        Реалізований
                      </span>
                    ) : status === 'current' ? (
                      <span className="inline-flex rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--primary)/0.15)] px-2.5 py-0.5 text-[11px] font-medium text-[hsl(var(--foreground))]">
                        Актуальний
                      </span>
                    ) : (
                      <span className="inline-flex rounded-full border border-dashed border-[hsl(var(--border))] px-2.5 py-0.5 text-[11px] text-[hsl(var(--muted-foreground))]">
                        Статус не обрано
                      </span>
                    )}
                  </div>

                  <div className="min-w-0 space-y-1">
                    <CardTitle className="text-[17px] font-semibold leading-snug tracking-tight">
                      {a.titleUk ?? a.title}
                    </CardTitle>
                    {a.updatedAt ? (
                      <CardDescription className="text-[12px]">
                        Оновлено: {new Date(a.updatedAt).toLocaleString('uk-UA')}
                      </CardDescription>
                    ) : null}
                  </div>

                  {excerpt ? (
                    <p className="line-clamp-3 text-[13px] leading-relaxed text-[hsl(var(--muted-foreground))]">
                      {excerpt}
                    </p>
                  ) : (
                    <p className="text-[13px] italic text-[hsl(var(--muted-foreground))]">Без короткого опису</p>
                  )}

                  <div className="mt-auto border-t border-[hsl(var(--border))] pt-3">
                    <Button asChild variant="secondary" className="w-full" size="sm">
                      <Link to={`/projects/${a._id}`}>Редагувати</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
