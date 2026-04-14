import { NavLink } from 'react-router-dom'
import { LayoutDashboard, CalendarDays, List, Download } from 'lucide-react'

const tabs = [
  { to: '/',             label: 'Overview',     icon: LayoutDashboard },
  { to: '/planning',     label: 'Planning',     icon: CalendarDays },
  { to: '/transactions', label: 'Transactions', icon: List },
  { to: '/export',       label: 'Export',       icon: Download },
]

export default function MobileBottomNav() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="flex">
        {tabs.map(({ to, label, icon: Icon }) => (
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
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
