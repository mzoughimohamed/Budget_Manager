// frontend/src/components/transactions/TransactionTable.jsx
import { Pencil, Trash2 } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteTransaction } from '../../api/transactions'
import { format } from 'date-fns'

export default function TransactionTable({ transactions, onEdit, month, cycleStartDay }) {
  const qc = useQueryClient()
  const deleteMutation = useMutation({
    mutationFn: deleteTransaction,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions', month, cycleStartDay] })
      qc.invalidateQueries({ queryKey: ['summary', month, cycleStartDay] })
    },
  })

  if (transactions.length === 0) {
    return <p className="text-center text-gray-400 py-10">No transactions this month</p>
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="px-4 py-3 text-left">Date</th>
              <th className="px-4 py-3 text-left">Type</th>
              <th className="px-4 py-3 text-left">Category</th>
              <th className="px-4 py-3 text-right">Amount</th>
              <th className="px-4 py-3 text-left">Note</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {transactions.map((tx) => (
              <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-gray-600">
                  {format(new Date(tx.date + 'T00:00:00'), 'MMM d')}
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    tx.type === 'expense' ? 'bg-red-100 text-app-danger' : 'bg-green-100 text-app-success'
                  }`}>
                    {tx.type}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600">{tx.category_detail?.name || '—'}</td>
                <td className={`px-4 py-3 text-right font-semibold ${
                  tx.type === 'expense' ? 'text-app-danger' : 'text-app-success'
                }`}>
                  {tx.type === 'expense' ? '-' : '+'}{Number(tx.amount).toLocaleString('fr-TN')} TND
                </td>
                <td className="px-4 py-3 text-gray-400">{tx.note || '—'}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => onEdit(tx)} className="text-gray-400 hover:text-gray-700">
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => deleteMutation.mutate(tx.id)}
                      className="text-gray-400 hover:text-app-danger"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
