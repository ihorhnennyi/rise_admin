import { useCallback, useEffect, useMemo, useState } from 'react'
import { apiFetch, ApiError } from '@admin/api/http'
import type { AdminUserRow, AdminUserRole, UsersListResponse } from '@admin/types/users'
import { AdminSectionShell } from '@admin/components/AdminSectionShell'
import { AlertDialog } from '@admin/components/ui/alert-dialog'
import { Button } from '@admin/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@admin/components/ui/card'
import { Input } from '@admin/components/ui/input'
import { Label } from '@admin/components/ui/label'
import { SelectMenu } from '@admin/components/ui/select-menu'
import { useMe } from '@admin/hooks/useMe'
import { toastError, toastSuccess } from '@admin/lib/toast'
import { UserPlus } from 'lucide-react'

const ROLE_OPTIONS: { value: AdminUserRole; label: string }[] = [
  {
    value: 'user',
    label:
      'Редактор — новини, напрямки, проєкти, звітність, про фонд, партнери, правила, cookie, конфіденційність, допомога',
  },
  { value: 'superadmin', label: 'Суперадмін — усе, включно з меню, футером, логотипом, «Підтримати» та користувачами' },
]

const USERS_NEW_SECTION_KEY = 'rise-admin:users:section:new-user'

function roleLabel(role: string) {
  if (role === 'superadmin') return 'Суперадмін'
  if (role === 'user') return 'Редактор'
  return role
}

function errMessage(e: unknown, fallback: string) {
  if (e instanceof ApiError && e.data && typeof e.data === 'object') {
    const m = (e.data as { message?: unknown }).message
    if (typeof m === 'string') return m
    if (Array.isArray(m) && typeof m[0] === 'string') return m[0]
  }
  return fallback
}

export function UsersPage() {
  const { me } = useMe()
  const myId = me?.userId ?? me?.id

  const [page, setPage] = useState(1)
  const limit = 10
  const [loading, setLoading] = useState(true)
  const [list, setList] = useState<AdminUserRow[]>([])
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 })

  const [createEmail, setCreateEmail] = useState('')
  const [createPassword, setCreatePassword] = useState('')
  const [createRole, setCreateRole] = useState<AdminUserRole>('user')
  const [creating, setCreating] = useState(false)

  const [editing, setEditing] = useState<AdminUserRow | null>(null)
  const [editEmail, setEditEmail] = useState('')
  const [editRole, setEditRole] = useState<AdminUserRole>('user')
  const [editPassword, setEditPassword] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)

  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteCandidate, setDeleteCandidate] = useState<AdminUserRow | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiFetch<UsersListResponse>(`/users?page=${page}&limit=${limit}`)
      setList(res.data)
      setMeta(res.meta)
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) return
      toastError('Помилка', errMessage(e, 'Не вдалося завантажити користувачів.'))
      setList([])
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    void load()
  }, [load])

  const roleSelectOptions = useMemo(() => ROLE_OPTIONS.map((o) => ({ value: o.value, label: o.label })), [])

  async function onCreate() {
    const email = createEmail.trim().toLowerCase()
    if (!email) {
      toastError('Помилка', 'Вкажіть email.')
      return
    }
    if (createPassword.length < 8) {
      toastError('Помилка', 'Пароль має бути не коротшим за 8 символів.')
      return
    }
    setCreating(true)
    try {
      await apiFetch('/users', {
        method: 'POST',
        json: { email, password: createPassword, role: createRole },
      })
      setCreateEmail('')
      setCreatePassword('')
      setCreateRole('user')
      toastSuccess('Створено', 'Користувач може увійти в адмінку з цим email і паролем.')
      await load()
    } catch (e) {
      toastError('Помилка', errMessage(e, 'Не вдалося створити користувача.'))
    } finally {
      setCreating(false)
    }
  }

  function openEdit(u: AdminUserRow) {
    setEditing(u)
    setEditEmail(u.email)
    setEditRole(u.role)
    setEditPassword('')
  }

  async function onSaveEdit() {
    if (!editing) return
    const email = editEmail.trim().toLowerCase()
    if (!email) {
      toastError('Помилка', 'Вкажіть email.')
      return
    }
    if (editPassword && editPassword.length < 8) {
      toastError('Помилка', 'Новий пароль — не менше 8 символів.')
      return
    }
    const body: { email?: string; role?: AdminUserRole; password?: string } = {}
    if (email !== editing.email) body.email = email
    if (editRole !== editing.role) body.role = editRole
    if (editPassword) body.password = editPassword
    if (Object.keys(body).length === 0) {
      setEditing(null)
      return
    }
    setSavingEdit(true)
    try {
      await apiFetch(`/users/${editing.id}`, { method: 'PATCH', json: body })
      toastSuccess('Збережено', '')
      setEditing(null)
      await load()
    } catch (e) {
      toastError('Помилка', errMessage(e, 'Не вдалося оновити користувача.'))
    } finally {
      setSavingEdit(false)
    }
  }

  function requestDelete(u: AdminUserRow) {
    if (u.id === myId) {
      toastError('Помилка', 'Не можна видалити власний обліковий запис.')
      return
    }
    setDeleteCandidate(u)
  }

  async function confirmDeleteUser() {
    const u = deleteCandidate
    if (!u) return
    setDeletingId(u.id)
    try {
      await apiFetch(`/users/${u.id}`, { method: 'DELETE' })
      toastSuccess('Видалено', '')
      if (editing?.id === u.id) setEditing(null)
      setDeleteCandidate(null)
      await load()
    } catch (e) {
      toastError('Помилка', errMessage(e, 'Не вдалося видалити користувача.'))
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-28">
      <div className="border-b border-[hsl(var(--border))] pb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-[hsl(var(--foreground))]">Користувачі</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">
          Облікові записи для входу в адмін-панель. Редактор бачить лише розділи контенту (новини, напрямки, проєкти,
          звітність, сторінки фонду та юридичні сторінки тощо); суперадмін керує ще меню, футером, логотипом і
          «Підтримати». Пароль передайте безпечним каналом.
        </p>
      </div>

      <AdminSectionShell
        icon={UserPlus}
        title="Новий користувач"
        description="Email, тимчасовий пароль (мінімум 8 символів) і роль. Після входу користувач може працювати з тим самим інтерфейсом."
        storageKey={USERS_NEW_SECTION_KEY}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-2 sm:col-span-2">
            <Label>Email *</Label>
            <Input
              type="email"
              autoComplete="off"
              value={createEmail}
              onChange={(e) => setCreateEmail(e.target.value)}
              placeholder="name@example.com"
            />
          </div>
          <div className="grid gap-2 sm:col-span-2">
            <Label>Пароль *</Label>
            <Input
              type="password"
              autoComplete="new-password"
              value={createPassword}
              onChange={(e) => setCreatePassword(e.target.value)}
              placeholder="Мінімум 8 символів"
            />
          </div>
          <div className="grid gap-2 sm:col-span-2">
            <Label>Роль</Label>
            <SelectMenu value={createRole} options={roleSelectOptions} onValueChange={(v) => setCreateRole(v as AdminUserRole)} />
          </div>
        </div>
        <Button type="button" className="mt-3" size="sm" disabled={creating} onClick={() => void onCreate()}>
          {creating ? 'Створюю…' : 'Створити користувача'}
        </Button>
      </AdminSectionShell>

      {editing ? (
        <Card className="border-[hsl(var(--border))] bg-[hsl(var(--card)/0.65)] shadow-sm backdrop-blur">
          <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0">
            <div>
              <CardTitle className="text-lg">Редагування</CardTitle>
              <CardDescription className="mt-1">{editing.email}</CardDescription>
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(null)}>
              Скасувати
            </Button>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-2 sm:col-span-2">
              <Label>Email</Label>
              <Input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
            </div>
            <div className="grid gap-2 sm:col-span-2">
              <Label>Новий пароль</Label>
              <Input
                type="password"
                autoComplete="new-password"
                value={editPassword}
                onChange={(e) => setEditPassword(e.target.value)}
                placeholder="Залиште порожнім, щоб не змінювати"
              />
            </div>
            <div className="grid gap-2 sm:col-span-2">
              <Label>Роль</Label>
              <SelectMenu value={editRole} options={roleSelectOptions} onValueChange={(v) => setEditRole(v as AdminUserRole)} />
            </div>
            <div className="flex flex-wrap gap-2 sm:col-span-2">
              <Button type="button" size="sm" disabled={savingEdit} onClick={() => void onSaveEdit()}>
                {savingEdit ? 'Зберігаю…' : 'Зберегти зміни'}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <AlertDialog
        open={Boolean(deleteCandidate)}
        title={`Видалити користувача ${deleteCandidate?.email ?? ''}?`}
        description="Цю дію не можна скасувати."
        cancelText="Скасувати"
        confirmText={deleteCandidate && deletingId === deleteCandidate.id ? 'Видаляю…' : 'Видалити'}
        destructive
        confirmDisabled={Boolean(deleteCandidate && deletingId === deleteCandidate.id)}
        onCancel={() => !deletingId && setDeleteCandidate(null)}
        onConfirm={confirmDeleteUser}
      />

      <Card className="overflow-hidden border-[hsl(var(--border))] bg-[hsl(var(--card)/0.65)] shadow-sm backdrop-blur">
        <CardHeader>
          <CardTitle className="text-lg">Список</CardTitle>
          <CardDescription>
            Усього: {meta.total}. Сторінка {meta.page} з {meta.totalPages}.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-0 sm:p-0">
          {loading ? (
            <p className="px-6 pb-6 text-sm text-[hsl(var(--muted-foreground))]">Завантаження…</p>
          ) : list.length === 0 ? (
            <p className="px-6 pb-6 text-sm text-[hsl(var(--muted-foreground))]">Поки що немає користувачів.</p>
          ) : (
            <div className="overflow-x-auto border-t border-[hsl(var(--border))]">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead className="border-b border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.15)] text-[hsl(var(--muted-foreground))]">
                  <tr>
                    <th className="px-4 py-3 font-medium">Email</th>
                    <th className="px-4 py-3 font-medium">Роль</th>
                    <th className="hidden px-4 py-3 font-medium sm:table-cell">Створено</th>
                    <th className="px-4 py-3 font-medium text-right">Дії</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((u) => (
                    <tr key={u.id} className="border-b border-[hsl(var(--border))] last:border-0">
                      <td className="px-4 py-3 font-medium text-[hsl(var(--foreground))]">
                        {u.email}
                        {u.id === myId ? (
                          <span className="ml-2 text-xs font-normal text-[hsl(var(--muted-foreground))]">(ви)</span>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-[hsl(var(--muted-foreground))]">{roleLabel(u.role)}</td>
                      <td className="hidden px-4 py-3 text-[hsl(var(--muted-foreground))] sm:table-cell">
                        {new Date(u.createdAt).toLocaleString('uk-UA')}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex flex-wrap justify-end gap-1">
                          <Button type="button" variant="secondary" size="sm" onClick={() => openEdit(u)}>
                            Змінити
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            disabled={u.id === myId || deletingId === u.id}
                            title={u.id === myId ? 'Не можна видалити себе' : undefined}
                            onClick={() => requestDelete(u)}
                          >
                            {deletingId === u.id ? '…' : 'Видалити'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {meta.totalPages > 1 ? (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[hsl(var(--border))] px-6 py-4">
              <Button type="button" variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Назад
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={page >= meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Далі
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
