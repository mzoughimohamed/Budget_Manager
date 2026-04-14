import * as LucideIcons from 'lucide-react'
import { useTranslation } from '../../contexts/LanguageContext'

function getIcon(iconName) {
  const pascal = iconName.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join('')
  return LucideIcons[pascal] || LucideIcons.CircleDot
}

export default function TopCategoryCards({ byCategory }) {
  const { t } = useTranslation()
  const top6 = [...byCategory]
    .filter((item) => Number(item.spent) > 0)
    .sort((a, b) => Number(b.spent) - Number(a.spent))
    .slice(0, 6)

  if (top6.length === 0) return null

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm">
      <h3 className="font-semibold text-gray-700 mb-4">{t('overview_top_categories')}</h3>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {top6.map(({ category, spent }) => {
          const Icon = getIcon(category.icon)
          return (
            <div key={category.id} className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-gray-50 transition-colors">
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: category.color + '22' }}>
                <Icon size={22} style={{ color: category.color }} />
              </div>
              <p className="text-xs font-medium text-gray-600 text-center leading-tight">{category.name}</p>
              <p className="text-xs text-gray-400">{Number(spent).toLocaleString('fr-TN')} TND</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
