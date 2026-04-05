import { useCallback, useEffect, useState } from 'react'
import { apiFetch, ApiError } from '@admin/api/http'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@admin/components/ui/card'
import { toastError } from '@admin/lib/toast'
import { BarChart3 } from 'lucide-react'

type CountRow = { key: string; count: number }

type RegionRow = { label: string; country: string; region: string; city: string; count: number }

type Overview = {
  from: string
  to: string
  days: number
  totalPageViews: number
  uniqueSessions: number
  byDevice: CountRow[]
  byBrowser: CountRow[]
  byOs: CountRow[]
  byCountry: CountRow[]
  byRegion: RegionRow[]
  byCity: RegionRow[]
  byPath: CountRow[]
  byReferrerHost: CountRow[]
  byDay: CountRow[]
  byHourKyiv: CountRow[]
  byLang: CountRow[]
  byTimezone: CountRow[]
  byScreenBucket: CountRow[]
}

const COUNTRY_UK: Record<string, string> = {
  UA: 'Україна',
  PL: 'Польща',
  DE: 'Німеччина',
  FR: 'Франція',
  US: 'США',
  GB: 'Велика Британія',
  CA: 'Канада',
  IT: 'Італія',
  ES: 'Іспанія',
  NL: 'Нідерланди',
  RO: 'Румунія',
  MD: 'Молдова',
  CZ: 'Чехія',
  SK: 'Словаччина',
  AT: 'Австрія',
  CH: 'Швейцарія',
  SE: 'Швеція',
  NO: 'Норвегія',
  PT: 'Португалія',
  IE: 'Ірландія',
  GR: 'Греція',
  HU: 'Угорщина',
  BG: 'Болгарія',
}

function countryLabel(code: string): string {
  if (!code || code === 'невідомо') return 'Невідомо'
  const name = COUNTRY_UK[code]
  return name ? `${name} (${code})` : code
}

function RankedBars({ rows }: { rows: CountRow[] }) {
  const max = Math.max(1, ...rows.map((r) => r.count))
  if (rows.length === 0) {
    return <p className="text-sm text-[hsl(var(--muted-foreground))]">Немає даних за період.</p>
  }
  return (
    <div className="space-y-3">
      {rows.map((r) => (
        <div key={r.key} className="space-y-1">
          <div className="flex justify-between gap-2 text-sm">
            <span className="min-w-0 truncate font-medium text-[hsl(var(--foreground))]" title={r.key}>
              {r.key}
            </span>
            <span className="shrink-0 tabular-nums text-[hsl(var(--muted-foreground))]">{r.count}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[hsl(var(--muted))]">
            <div
              className="h-2 rounded-full bg-[hsl(var(--primary))]"
              style={{ width: `${(r.count / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

function RegionTable({ rows, title }: { rows: RegionRow[]; title: string }) {
  if (rows.length === 0) {
    return <p className="text-sm text-[hsl(var(--muted-foreground))]">Немає даних за період.</p>
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <caption className="sr-only">{title}</caption>
        <thead>
          <tr className="border-b border-[hsl(var(--border))] text-left text-[hsl(var(--muted-foreground))]">
            <th className="pb-2 pr-2 font-medium">Локація</th>
            <th className="pb-2 text-right font-medium">Перегляди</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label} className="border-b border-[hsl(var(--border)/0.5)] last:border-0">
              <td className="py-2 pr-2">{r.label}</td>
              <td className="py-2 text-right tabular-nums">{r.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const DAY_OPTIONS = [7, 30, 90] as const

export function AnalyticsOverviewPage() {
  const [days, setDays] = useState<number>(7)
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<Overview | null>(null)

  const load = useCallback(async (d: number) => {
    setLoading(true)
    try {
      const o = await apiFetch<Overview>(`/analytics/overview?days=${d}`)
      setData(o)
    } catch (e) {
      if (e instanceof ApiError) {
        toastError(e.status === 403 ? 'Немає доступу' : e.message)
      } else {
        toastError('Не вдалося завантажити аналітику')
      }
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load(days)
  }, [days, load])

  const byCountryLabeled: CountRow[] =
    data?.byCountry.map((r) => ({
      key: countryLabel(r.key),
      count: r.count,
    })) ?? []

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[hsl(var(--muted))] text-[hsl(var(--foreground))]">
            <BarChart3 className="h-5 w-5" aria-hidden />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-[hsl(var(--foreground))]">
              Аналітика відвідувань
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-[hsl(var(--muted-foreground))]">
              Дані збираються на сервері при переходах по сайту (тип пристрою, браузер, ОС, країна та регіон за IP, мова й
              часовий пояс браузера, ширина екрана). Гео: за наявності — MaxMind GeoLite2 за IP; інакше країна з заголовків CDN
              (Cloudflare, Vercel тощо); далі резерв geoip-lite. Локально часто «невідомо». Запис без User-Agent не ведеться;
              боти відсікаються (isbot + ua-parser).
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {DAY_OPTIONS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDays(d)}
              className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                days === d
                  ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
                  : 'border-[hsl(var(--border))] bg-[hsl(var(--card)/0.5)] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]'
              }`}
            >
              {d} дн.
            </button>
          ))}
        </div>
      </div>

      {loading && !data ? (
        <p className="text-sm text-[hsl(var(--muted-foreground))]">Завантаження…</p>
      ) : data ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="bg-[hsl(var(--card)/0.65)] backdrop-blur">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Перегляди сторінок</CardTitle>
                <CardDescription>Усі записи за період</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold tabular-nums">{data.totalPageViews}</p>
              </CardContent>
            </Card>
            <Card className="bg-[hsl(var(--card)/0.65)] backdrop-blur">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Унікальні сесії</CardTitle>
                <CardDescription>За ідентифікатором у браузері</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold tabular-nums">{data.uniqueSessions}</p>
              </CardContent>
            </Card>
            <Card className="bg-[hsl(var(--card)/0.65)] backdrop-blur sm:col-span-2 lg:col-span-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Період</CardTitle>
                <CardDescription>Час сервера (UTC у відповіді)</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-[hsl(var(--muted-foreground))]">
                <p>Від: {new Date(data.from).toLocaleString('uk-UA')}</p>
                <p className="mt-1">До: {new Date(data.to).toLocaleString('uk-UA')}</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="bg-[hsl(var(--card)/0.65)] backdrop-blur">
              <CardHeader>
                <CardTitle>Динаміка по днях</CardTitle>
                <CardDescription>Часовий пояс: Київ</CardDescription>
              </CardHeader>
              <CardContent>
                <RankedBars rows={data.byDay.map((d) => ({ key: d.key, count: d.count }))} />
              </CardContent>
            </Card>
            <Card className="bg-[hsl(var(--card)/0.65)] backdrop-blur">
              <CardHeader>
                <CardTitle>Години доби (Київ)</CardTitle>
                <CardDescription>Сума переглядів за годину, усі дні періоду</CardDescription>
              </CardHeader>
              <CardContent>
                <RankedBars rows={data.byHourKyiv} />
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="bg-[hsl(var(--card)/0.65)] backdrop-blur">
              <CardHeader>
                <CardTitle>Тип пристрою</CardTitle>
              </CardHeader>
              <CardContent>
                <RankedBars rows={data.byDevice} />
              </CardContent>
            </Card>
            <Card className="bg-[hsl(var(--card)/0.65)] backdrop-blur">
              <CardHeader>
                <CardTitle>Ширина екрана (категорії)</CardTitle>
              </CardHeader>
              <CardContent>
                <RankedBars rows={data.byScreenBucket} />
              </CardContent>
            </Card>
            <Card className="bg-[hsl(var(--card)/0.65)] backdrop-blur">
              <CardHeader>
                <CardTitle>Браузер</CardTitle>
              </CardHeader>
              <CardContent>
                <RankedBars rows={data.byBrowser} />
              </CardContent>
            </Card>
            <Card className="bg-[hsl(var(--card)/0.65)] backdrop-blur">
              <CardHeader>
                <CardTitle>Операційна система</CardTitle>
              </CardHeader>
              <CardContent>
                <RankedBars rows={data.byOs} />
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="bg-[hsl(var(--card)/0.65)] backdrop-blur">
              <CardHeader>
                <CardTitle>Країна (за IP)</CardTitle>
              </CardHeader>
              <CardContent>
                <RankedBars rows={byCountryLabeled} />
              </CardContent>
            </Card>
            <Card className="bg-[hsl(var(--card)/0.65)] backdrop-blur">
              <CardHeader>
                <CardTitle>Регіон / штат (за IP)</CardTitle>
                <CardDescription>Код країни та субрегіон з бази GeoIP</CardDescription>
              </CardHeader>
              <CardContent>
                <RegionTable rows={data.byRegion} title="Регіони" />
              </CardContent>
            </Card>
            <Card className="bg-[hsl(var(--card)/0.65)] backdrop-blur lg:col-span-2">
              <CardHeader>
                <CardTitle>Місто (за IP)</CardTitle>
                <CardDescription>Лише записи, де вдалося визначити місто</CardDescription>
              </CardHeader>
              <CardContent>
                <RegionTable rows={data.byCity} title="Міста" />
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="bg-[hsl(var(--card)/0.65)] backdrop-blur">
              <CardHeader>
                <CardTitle>Сторінки (шлях)</CardTitle>
              </CardHeader>
              <CardContent>
                <RankedBars rows={data.byPath} />
              </CardContent>
            </Card>
            <Card className="bg-[hsl(var(--card)/0.65)] backdrop-blur">
              <CardHeader>
                <CardTitle>Джерело переходу</CardTitle>
                <CardDescription>Домен з Referer; «прямий» — без referer</CardDescription>
              </CardHeader>
              <CardContent>
                <RankedBars rows={data.byReferrerHost} />
              </CardContent>
            </Card>
            <Card className="bg-[hsl(var(--card)/0.65)] backdrop-blur">
              <CardHeader>
                <CardTitle>Мова браузера</CardTitle>
              </CardHeader>
              <CardContent>
                <RankedBars rows={data.byLang} />
              </CardContent>
            </Card>
            <Card className="bg-[hsl(var(--card)/0.65)] backdrop-blur">
              <CardHeader>
                <CardTitle>Часовий пояс (браузер)</CardTitle>
              </CardHeader>
              <CardContent>
                <RankedBars rows={data.byTimezone} />
              </CardContent>
            </Card>
          </div>
        </>
      ) : null}
    </div>
  )
}
