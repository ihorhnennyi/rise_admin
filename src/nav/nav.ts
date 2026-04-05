import type { LucideIcon } from 'lucide-react'
import {
  CircleHelp,
  FileText,
  FolderKanban,
  PanelBottom,
  List,
  Handshake,
  Info,
  LayoutDashboard,
  LineChart,
  BarChart3,
  Newspaper,
  Target,
  ShieldCheck,
  Cookie,
  Lock,
  HeartHandshake,
  Users,
} from 'lucide-react'

export type NavItem = {
  label: string
  to: string
  icon: LucideIcon
  /** Лише superadmin: глобальні налаштування, меню, футер, підтримка, користувачі */
  superadminOnly?: boolean
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Основна Інформація', to: '/', icon: LayoutDashboard, superadminOnly: true },
  { label: 'Користувачі', to: '/users', icon: Users, superadminOnly: true },
  { label: 'Елементи меню', to: '/menu', icon: List, superadminOnly: true },
  { label: 'Футер', to: '/footer', icon: PanelBottom, superadminOnly: true },
  { label: 'Скрипти та аналітика', to: '/marketing-scripts', icon: LineChart, superadminOnly: true },
  { label: 'Аналітика відвідувань', to: '/analytics', icon: BarChart3, superadminOnly: true },
  { label: 'Новини', to: '/news', icon: Newspaper },
  { label: 'Напрямки діяльності', to: '/directions', icon: Target },
  { label: 'Проєкти', to: '/projects', icon: FolderKanban },
  { label: 'Про Фонд', to: '/about', icon: Info },
  { label: 'Партнери', to: '/partners', icon: Handshake },
  { label: 'Звітність та документи', to: '/reports', icon: FileText },
  { label: 'Підтримати', to: '/support', icon: HeartHandshake, superadminOnly: true },
  { label: 'Правила користування', to: '/terms', icon: ShieldCheck },
  { label: 'Політика щодо файлів cookie', to: '/cookies', icon: Cookie },
  { label: 'Політика конфіденційності', to: '/privacy', icon: Lock },
  { label: 'Допомога', to: '/help', icon: CircleHelp },
]
