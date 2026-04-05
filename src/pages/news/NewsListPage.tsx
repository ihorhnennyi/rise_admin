import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { apiFetch, ApiError } from '@admin/api/http'
import type { News } from '@admin/types/news'
import { Button } from '@admin/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@admin/components/ui/card'
import { API_BASE_URL } from '@admin/api/config'
import { toastError } from '@admin/lib/toast'

export function NewsListPage() {
  const [items, setItems] = useState<News[]>([])
  const [loading, setLoading] = useState(true)

  function countImages(n: News): number {
    const cover = n.coverImageUrl ? 1 : 0
    const gallery = n.imageUrls?.length ?? 0
    const blockImages =
      Array.isArray(n.blocks)
        ? n.blocks.filter((b) => b.type === 'image' && typeof b.url === 'string' && b.url.length > 0).length
        : 0
    return cover + gallery + blockImages
  }

  useEffect(() => {
    let cancelled = false
    async function run() {
      try {
        const data = await apiFetch<News[]>('/news')
        if (!cancelled) setItems(data)
      } catch (e) {
        if (!cancelled) setItems([])
        if (e instanceof ApiError && e.status === 401) return
        toastError('Помилка', 'Не вдалося завантажити список новин.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[hsl(var(--foreground))]">
            Новини
          </h1>
          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
            Список новин та керування публікаціями.
          </p>
        </div>
        <Button asChild size="sm">
          <Link to="/news/new">Створити новину</Link>
        </Button>
      </div>

      {loading ? (
        <div className="text-sm text-[hsl(var(--muted-foreground))]">Loading…</div>
      ) : items.length === 0 ? (
        <Card className="bg-[hsl(var(--card)/0.65)] backdrop-blur">
          <CardHeader>
            <CardTitle>Поки що порожньо</CardTitle>
            <CardDescription>Створи першу новину.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((n) => (
            <Card
              key={n._id}
              className="bg-[hsl(var(--card)/0.65)] backdrop-blur"
            >
              <CardHeader className="flex-row items-start justify-between gap-3 space-y-0 p-4">
                <div className="min-w-0">
                  <CardTitle className="truncate text-base">{n.title}</CardTitle>
                  <CardDescription className="truncate text-xs">
                    {n.updatedAt ? `Оновлено: ${new Date(n.updatedAt).toLocaleString()}` : ''}
                  </CardDescription>
                </div>
                <Button asChild variant="secondary" size="sm">
                  <Link to={`/news/${n._id}`}>Редагувати</Link>
                </Button>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                {n.coverImageUrl ? (
                  <div className="mb-2 overflow-hidden rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card)/0.4)]">
                    <img
                      src={`${API_BASE_URL.replace(/\/api$/, '')}${n.coverImageUrl}`}
                      alt=""
                      className="aspect-[21/9] w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                ) : null}
                {n.excerpt ? (
                  <div className="text-sm text-[hsl(var(--muted-foreground))]">
                    {n.excerpt.length > 140 ? `${n.excerpt.slice(0, 140)}…` : n.excerpt}
                  </div>
                ) : null}
                <div className="text-xs text-[hsl(var(--muted-foreground))]">
                  Картинок: {countImages(n)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

