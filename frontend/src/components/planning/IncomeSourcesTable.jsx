import { useState } from 'react'
import { Plus, Trash2, Check, X } from 'lucide-react'
import { useQueryClient, useMutation } from '@tanstack/react-query'
import { createIncomeSource, updateIncomeSource, deleteIncomeSource } from '../../api/incomeSources'
import { useTranslation } from '../../contexts/LanguageContext'

export default function IncomeSourcesTable({ incomeSources, month }) {
  const qc = useQueryClient()
  const { t } = useTranslation()
  const [newName, setNewName] = useState('')
  const [newAmount, setNewAmount] = useState('')
  const [editId, setEditId] = useState(null)
  const [editAmount, setEditAmount] = useState('')

  const invalidate = () => qc.invalidateQueries({ queryKey: ['incomeSources', month] })

  const addMutation = useMutation({
    mutationFn: () => createIncomeSource({ name: newName, amount: newAmount, month: month + '-01' }),
    onSuccess: () => { setNewName(''); setNewAmount(''); invalidate() },
  })

  const updateMutation = useMutation({
    mutationFn: (id) => updateIncomeSource(id, { amount: editAmount }),
    onSuccess: () => { setEditId(null); invalidate() },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteIncomeSource,
    onSuccess: invalidate,
  })

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm">
      <h3 className="font-semibold text-gray-700 mb-4">{t('planning_income_sources')}</h3>
      <div className="space-y-2 mb-4">
        {incomeSources.map((src) => (
          <div key={src.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <span className="flex-1 text-sm font-medium text-gray-700">{src.name}</span>
            {editId === src.id ? (
              <>
                <input
                  type="number"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  className="w-28 border rounded px-2 py-1 text-sm"
                />
                <button onClick={() => updateMutation.mutate(src.id)} className="text-app-success"><Check size={16} /></button>
                <button onClick={() => setEditId(null)} className="text-gray-400"><X size={16} /></button>
              </>
            ) : (
              <>
                <button
                  onClick={() => { setEditId(src.id); setEditAmount(src.amount) }}
                  className="text-sm text-gray-500 hover:text-gray-800"
                >
                  {Number(src.amount).toLocaleString('fr-TN')} TND
                </button>
                <button onClick={() => deleteMutation.mutate(src.id)} className="text-app-danger hover:opacity-70">
                  <Trash2 size={15} />
                </button>
              </>
            )}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          placeholder={t('planning_source_name')}
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-app-accent"
        />
        <input
          type="number"
          placeholder={t('common_amount')}
          value={newAmount}
          onChange={(e) => setNewAmount(e.target.value)}
          className="w-28 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-app-accent"
        />
        <button
          onClick={() => addMutation.mutate()}
          disabled={!newName || !newAmount}
          className="bg-app-accent text-white px-3 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50"
        >
          <Plus size={18} />
        </button>
      </div>
    </div>
  )
}
