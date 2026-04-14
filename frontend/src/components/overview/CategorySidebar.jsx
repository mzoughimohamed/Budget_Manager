import { useTranslation } from '../../contexts/LanguageContext'

export default function CategorySidebar({ byCategory }) {
  const { t } = useTranslation()
  const active = byCategory.filter((item) => Number(item.limit) > 0 || Number(item.spent) > 0)

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm">
      <h3 className="font-semibold text-gray-700 mb-4">{t('overview_categories')}</h3>
      <div className="space-y-4">
        {active.map(({ category, spent, limit, over_budget }) => {
          const spentNum = Number(spent)
          const limitNum = Number(limit)
          const pct = limitNum > 0 ? Math.min((spentNum / limitNum) * 100, 100) : 0
          return (
            <div key={category.id}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-gray-700">{category.name}</span>
                <span className={`text-xs font-semibold ${over_budget ? 'text-app-danger' : 'text-gray-500'}`}>
                  {spentNum.toLocaleString('fr-TN')}
                  {limitNum > 0 && ` / ${limitNum.toLocaleString('fr-TN')}`} TND
                </span>
              </div>
              {limitNum > 0 && (
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${over_budget ? 'bg-app-danger' : 'bg-app-success'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              )}
            </div>
          )
        })}
        {active.length === 0 && (
          <p className="text-sm text-gray-400">{t('overview_no_activity')}</p>
        )}
      </div>
    </div>
  )
}
