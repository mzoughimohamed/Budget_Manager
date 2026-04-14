// frontend/src/components/transactions/TransactionForm.jsx
import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { format } from 'date-fns'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createTransaction, updateTransaction } from '../../api/transactions'

export default function TransactionForm({ categories, onClose, initialDate, initialData, month, cycleStartDay }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({
    amount: '',
    type: 'expense',
    category: '',
    date: initialDate || format(new Date(), 'yyyy-MM-dd'),
    note: '',
  })

  useEffect(() => {
    if (initialData) {
      setForm({
        amount: initialData.amount,
        type: initialData.type,
        category: initialData.category || '',
        date: initialData.date,
        note: initialData.note || '',
      })
    }
  }, [initialData])

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['transactions', month, cycleStartDay] })
    qc.invalidateQueries({ queryKey: ['summary', month, cycleStartDay] })
  }

  const saveMutation = useMutation({
    mutationFn: () => initialData
      ? updateTransaction(initialData.id, form)
      : createTransaction({ ...form, category: form.category || null }),
    onSuccess: () => { invalidate(); onClose() },
  })

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex justify-between items-center mb-5">
          <h3 className="font-semibold text-gray-800">
            {initialData ? 'Edit Transaction' : 'Add Transaction'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <div className="space-y-4">
          <div className="flex gap-2">
            {['expense', 'income'].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setForm((f) => ({ ...f, type: t }))}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                  form.type === t
                    ? t === 'expense' ? 'bg-app-danger text-white' : 'bg-app-success text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <input
            type="number"
            placeholder="Amount (TND)"
            value={form.amount}
            onChange={set('amount')}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-app-accent"
            required
          />
          {form.type === 'expense' && (
            <select
              value={form.category}
              onChange={set('category')}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-app-accent"
            >
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          )}
          <input
            type="date"
            value={form.date}
            onChange={set('date')}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-app-accent"
          />
          <input
            type="text"
            placeholder="Note (optional)"
            value={form.note}
            onChange={set('note')}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-app-accent"
          />
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={() => saveMutation.mutate()}
            disabled={!form.amount || saveMutation.isPending}
            className="flex-1 py-2 bg-app-accent text-white rounded-lg text-sm font-medium hover:bg-blue-600 disabled:opacity-50"
          >
            {saveMutation.isPending ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
