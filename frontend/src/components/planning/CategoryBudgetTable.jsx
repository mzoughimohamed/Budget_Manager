// frontend/src/components/planning/CategoryBudgetTable.jsx
import { useState } from 'react'
import { Check, X } from 'lucide-react'
import { useQueryClient, useMutation } from '@tanstack/react-query'
import { updateCategory } from '../../api/categories'
import * as LucideIcons from 'lucide-react'

function getIcon(iconName) {
  const pascal = iconName.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join('')
  return LucideIcons[pascal] || LucideIcons.CircleDot
}

export default function CategoryBudgetTable({ categories }) {
  const qc = useQueryClient()
  const [editId, setEditId] = useState(null)
  const [editLimit, setEditLimit] = useState('')

  const updateMutation = useMutation({
    mutationFn: (id) => updateCategory(id, { budget_limit: editLimit }),
    onSuccess: () => {
      setEditId(null)
      qc.invalidateQueries({ queryKey: ['categories'] })
    },
  })

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm">
      <h3 className="font-semibold text-gray-700 mb-1">Category Budget Limits</h3>
      <p className="text-xs text-gray-400 mb-4">Limits apply to every month</p>
      <div className="space-y-2">
        {categories.map((cat) => {
          const Icon = getIcon(cat.icon)
          return (
            <div key={cat.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: cat.color + '22' }}>
                <Icon size={16} style={{ color: cat.color }} />
              </div>
              <span className="flex-1 text-sm font-medium text-gray-700">{cat.name}</span>
              {editId === cat.id ? (
                <>
                  <input
                    type="number"
                    value={editLimit}
                    onChange={(e) => setEditLimit(e.target.value)}
                    className="w-28 border rounded px-2 py-1 text-sm"
                    autoFocus
                  />
                  <button onClick={() => updateMutation.mutate(cat.id)} className="text-app-success"><Check size={16} /></button>
                  <button onClick={() => setEditId(null)} className="text-gray-400"><X size={16} /></button>
                </>
              ) : (
                <button
                  onClick={() => { setEditId(cat.id); setEditLimit(cat.budget_limit) }}
                  className="text-sm text-gray-500 hover:text-gray-800"
                >
                  {Number(cat.budget_limit) > 0
                    ? `${Number(cat.budget_limit).toLocaleString('fr-TN')} TND`
                    : 'Set limit'}
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
