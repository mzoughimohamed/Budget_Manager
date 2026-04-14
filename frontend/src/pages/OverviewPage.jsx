import { useState } from 'react'
import { format } from 'date-fns'
import { useQuery } from '@tanstack/react-query'
import { getSummary } from '../api/summary'
import { getTransactions } from '../api/transactions'
import { useCycleSettings } from '../hooks/useCycleSettings'
import { useTranslation } from '../contexts/LanguageContext'
import MonthPicker from '../components/planning/MonthPicker'
import StatsRow from '../components/overview/StatsRow'
import BudgetDonutChart from '../components/overview/BudgetDonutChart'
import CategorySidebar from '../components/overview/CategorySidebar'
import MonthCalendar from '../components/overview/MonthCalendar'
import TopCategoryCards from '../components/overview/TopCategoryCards'

export default function OverviewPage() {
  const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'))
  const { cycleStartDay, cycleRange } = useCycleSettings()
  const { start, end, label } = cycleRange(month)
  const { t } = useTranslation()

  const { data: summary } = useQuery({
    queryKey: ['summary', month, cycleStartDay],
    queryFn: () => getSummary({ start, end, month }).then((r) => r.data),
  })

  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions', month, cycleStartDay],
    queryFn: () => getTransactions({ start, end }).then((r) => r.data),
  })

  if (!summary) {
    return <div className="flex justify-center py-20 text-gray-400">{t('common_loading')}</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">{t('overview_title')}</h2>
        <MonthPicker value={month} onChange={setMonth} cycleLabel={label} />
      </div>

      <StatsRow
        totalIncome={summary.total_income}
        totalExpenses={summary.total_expenses}
        netSavings={summary.net_savings}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <BudgetDonutChart byCategory={summary.by_category} />
          <MonthCalendar transactions={transactions} cycleStart={start} cycleEnd={end} />
          <TopCategoryCards byCategory={summary.by_category} />
        </div>
        <div>
          <CategorySidebar byCategory={summary.by_category} />
        </div>
      </div>
    </div>
  )
}
