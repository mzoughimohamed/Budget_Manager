import { NavLink, useNavigate } from 'react-router-dom'
import { LogOut, Wallet } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useTranslation } from '../../contexts/LanguageContext'
import { logout } from '../../api/auth'
import LangSwitcher from './LangSwitcher'

const TABS = [
  { to: '/',             labelKey: 'nav_overview' },
  { to: '/planning',     labelKey: 'nav_planning' },
  { to: '/transactions', labelKey: 'nav_transactions' },
  { to: '/export',       labelKey: 'nav_export' },
  { to: '/settings',     labelKey: 'nav_settings' },
]

export default function TopNav() {
  const { setUser } = useAuth()
  const { t } = useTranslation()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    setUser(null)
    navigate('/login')
  }

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14">
        <div className="flex items-center gap-2 font-bold text-app-accent text-lg">
          <Wallet size={20} />
          Budget
        </div>
        <div className="hidden md:flex gap-1">
          {TABS.map(({ to, labelKey }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-app-accent text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`
              }
            >
              {t(labelKey)}
            </NavLink>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <LangSwitcher />
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-500 transition-colors"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">{t('nav_logout')}</span>
          </button>
        </div>
      </div>
    </nav>
  )
}
