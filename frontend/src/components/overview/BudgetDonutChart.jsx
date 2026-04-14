import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { useTranslation } from '../../contexts/LanguageContext'

export default function BudgetDonutChart({ byCategory }) {
  const { t } = useTranslation()
  const data = byCategory
    .filter((item) => Number(item.spent) > 0)
    .map((item) => ({
      name: item.category.name,
      value: Number(item.spent),
      color: item.category.color,
    }))

  const total = data.reduce((sum, d) => sum + d.value, 0)

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm flex items-center justify-center h-64 text-gray-400 text-sm">
        {t('overview_no_expenses')}
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-700">{t('overview_budget_breakdown')}</h3>
        <span className="text-sm text-gray-500">{total.toLocaleString('fr-TN')} TND {t('overview_total')}</span>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={70} outerRadius={110} paddingAngle={3} dataKey="value">
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => [`${value.toLocaleString('fr-TN')} TND`]} />
          <Legend formatter={(value) => <span className="text-sm text-gray-600">{value}</span>} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
