// frontend/src/components/overview/DayPanel.jsx
import { X, Plus } from 'lucide-react'
import { format } from 'date-fns'

export default function DayPanel({ date, transactions, onClose, onAddTransaction }) {
  const dayTransactions = transactions.filter((tx) => tx.date === date)
  const formattedDate = format(new Date(date + 'T00:00:00'), 'EEEE, MMMM d yyyy')

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div
        className="bg-white w-full max-w-sm h-full shadow-2xl p-6 overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold text-gray-800">{formattedDate}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>
        <div className="space-y-3 mb-6">
          {dayTransactions.length === 0 ? (
            <p className="text-sm text-gray-400">No transactions on this day</p>
          ) : (
            dayTransactions.map((tx) => (
              <div key={tx.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    {tx.category_detail?.name || tx.type}
                  </p>
                  {tx.note && <p className="text-xs text-gray-400">{tx.note}</p>}
                </div>
                <span className={`text-sm font-semibold ${tx.type === 'expense' ? 'text-app-danger' : 'text-app-success'}`}>
                  {tx.type === 'expense' ? '-' : '+'}{Number(tx.amount).toLocaleString('fr-TN')} TND
                </span>
              </div>
            ))
          )}
        </div>
        <button
          onClick={() => onAddTransaction(date)}
          className="w-full flex items-center justify-center gap-2 bg-app-accent text-white py-2.5 rounded-xl font-medium hover:bg-blue-600 transition-colors"
        >
          <Plus size={18} />
          Add Transaction
        </button>
      </div>
    </div>
  )
}
