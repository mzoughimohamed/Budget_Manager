import { NavLink } from 'react-router-dom'
import { LayoutDashboard, CalendarDays, List, Download, Settings } from 'lucide-react'
import { useTranslation } from '../../contexts/LanguageContext'

const TABS = [
  { to: '/',             labelKey: 'nav_overview',     icon: LayoutDashboard },
  { to: '/planning',     labelKey: 'nav_planning',     icon: CalendarDays },
  { to: '/transactions', labelKey: 'nav_transactions', icon: List },
  { to: '/export',       labelKey: 'nav_export',       icon: Download },
  { to: '/settings',     labelKey: 'nav_settings',     icon: Settings },
]

export default function MobileBottomNav() {
  const { t } = useTranslation()
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="flex">
        {TABS.map(({ to, labelKey, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center py-2 text-xs transition-colors ${
                isActive ? 'text-app-accent' : 'text-gray-500'
              }`
            }
          >
            <Icon size={20} />
            {t(labelKey)}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
