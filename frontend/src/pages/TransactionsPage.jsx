import { useState } from 'react'
import { format } from 'date-fns'
import { Plus } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { getTransactions } from '../api/transactions'
import { getCategories } from '../api/categories'
import { useCycleSettings } from '../hooks/useCycleSettings'
import { useTranslation } from '../contexts/LanguageContext'
import MonthPicker from '../components/planning/MonthPicker'
import TransactionTable from '../components/transactions/TransactionTable'
import TransactionForm from '../components/transactions/TransactionForm'

export default function TransactionsPage() {
  const [searchParams] = useSearchParams()
  const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'))
  const [showForm, setShowForm] = useState(!!searchParams.get('date'))
  const [editingTx, setEditingTx] = useState(null)
  const { cycleStartDay, cycleRange } = useCycleSettings()
  const { start, end, label } = cycleRange(month)
  const { t } = useTranslation()

  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions', month, cycleStartDay],
    queryFn: () => getTransactions({ start, end }).then((r) => r.data),
  })

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => getCategories().then((r) => r.data),
  })

  const handleEdit = (tx) => { setEditingTx(tx); setShowForm(true) }
  const handleClose = () => { setShowForm(false); setEditingTx(null) }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">{t('transactions_title')}</h2>
        <div className="flex items-center gap-3">
          <MonthPicker value={month} onChange={setMonth} cycleLabel={label} />
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 bg-app-accent text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-600 transition-colors"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">{t('common_add')}</span>
          </button>
        </div>
      </div>

      <TransactionTable
        transactions={transactions}
        onEdit={handleEdit}
        month={month}
        cycleStartDay={cycleStartDay}
      />

      {showForm && (
        <TransactionForm
          categories={categories}
          onClose={handleClose}
          initialDate={searchParams.get('date')}
          initialData={editingTx}
          month={month}
          cycleStartDay={cycleStartDay}
        />
      )}
    </div>
  )
}
