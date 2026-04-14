// frontend/src/pages/PlanningPage.jsx
import { useState } from 'react'
import { format } from 'date-fns'
import { useQuery } from '@tanstack/react-query'
import { getIncomeSources } from '../api/incomeSources'
import { getCategories } from '../api/categories'
import { useCycleSettings } from '../hooks/useCycleSettings'
import MonthPicker from '../components/planning/MonthPicker'
import IncomeSourcesTable from '../components/planning/IncomeSourcesTable'
import CategoryBudgetTable from '../components/planning/CategoryBudgetTable'

export default function PlanningPage() {
  const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'))
  const { cycleRange } = useCycleSettings()
  const { label } = cycleRange(month)

  const { data: incomeSources = [] } = useQuery({
    queryKey: ['incomeSources', month],
    queryFn: () => getIncomeSources(month).then((r) => r.data),
  })

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => getCategories().then((r) => r.data),
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">Planning</h2>
        <MonthPicker value={month} onChange={setMonth} cycleLabel={label} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <IncomeSourcesTable incomeSources={incomeSources} month={month} />
        <CategoryBudgetTable categories={categories} />
      </div>
    </div>
  )
}
