import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as LucideIcons from 'lucide-react'
import { getSettings, updateSettings } from '../api/settings'
import { getCategories, createCategory, updateCategory, deleteCategory } from '../api/categories'

const ICON_OPTIONS = [
  'utensils', 'car', 'home', 'zap', 'droplets', 'wifi', 'heart-pulse',
  'tv', 'shirt', 'book-open', 'piggy-bank', 'circle-dot', 'shopping-cart',
  'coffee', 'music', 'plane', 'dumbbell', 'baby', 'briefcase', 'gift',
  'smartphone', 'scissors', 'wrench', 'bus', 'graduation-cap',
]

function getIcon(iconName) {
  const pascal = iconName.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join('')
  return LucideIcons[pascal] || LucideIcons.CircleDot
}

function CategoryRow({ cat, onEdit, onDelete }) {
  const Icon = getIcon(cat.icon)
  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: cat.color + '22' }}
      >
        <Icon size={16} style={{ color: cat.color }} />
      </div>
      <span className="flex-1 text-sm font-medium text-gray-700">{cat.name}</span>
      {cat.is_preset && (
        <span className="text-xs text-gray-400 bg-gray-200 px-2 py-0.5 rounded-full">preset</span>
      )}
      <button onClick={() => onEdit(cat)} className="text-gray-400 hover:text-gray-700">
        <Pencil size={15} />
      </button>
      {!cat.is_preset && (
        <button onClick={() => onDelete(cat.id)} className="text-gray-400 hover:text-red-500">
          <Trash2 size={15} />
        </button>
      )}
    </div>
  )
}

function CategoryForm({ initial, onSave, onCancel }) {
  const [name, setName] = useState(initial?.name || '')
  const [icon, setIcon] = useState(initial?.icon || 'circle-dot')
  const [color, setColor] = useState(initial?.color || '#6B7280')
  const PreviewIcon = getIcon(icon)

  return (
    <div className="p-3 bg-blue-50 rounded-lg space-y-3">
      <input
        type="text"
        placeholder="Category name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-app-accent"
        autoFocus
      />
      <div className="flex gap-2 items-center">
        <div className="flex-1">
          <label className="block text-xs text-gray-500 mb-1">Icon</label>
          <select
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-app-accent"
          >
            {ICON_OPTIONS.map((i) => (
              <option key={i} value={i}>{i}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Color</label>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="h-9 w-14 border rounded-lg cursor-pointer"
          />
        </div>
        <div className="flex-shrink-0 mt-4">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ backgroundColor: color + '33' }}
          >
            <PreviewIcon size={18} style={{ color }} />
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onSave({ name, icon, color })}
          disabled={!name.trim()}
          className="flex items-center gap-1.5 bg-app-accent text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 disabled:opacity-50"
        >
          <Check size={14} /> Save
        </button>
        <button
          onClick={onCancel}
          className="flex items-center gap-1.5 border px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
        >
          <X size={14} /> Cancel
        </button>
      </div>
    </div>
  )
}

function CategoriesCard() {
  const qc = useQueryClient()
  const [editingId, setEditingId] = useState(null)
  const [adding, setAdding] = useState(false)

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => getCategories().then((r) => r.data),
  })

  const invalidate = () => qc.invalidateQueries({ queryKey: ['categories'] })

  const createMutation = useMutation({
    mutationFn: (data) => createCategory(data),
    onSuccess: () => { invalidate(); setAdding(false) },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateCategory(id, data),
    onSuccess: () => { invalidate(); setEditingId(null) },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: invalidate,
  })

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm max-w-md">
      <h3 className="font-semibold text-gray-700 mb-5">Categories</h3>
      <div className="space-y-2">
        {categories.map((cat) =>
          editingId === cat.id ? (
            <CategoryForm
              key={cat.id}
              initial={cat}
              onSave={(data) => updateMutation.mutate({ id: cat.id, data })}
              onCancel={() => setEditingId(null)}
            />
          ) : (
            <CategoryRow
              key={cat.id}
              cat={cat}
              onEdit={(c) => { setAdding(false); setEditingId(c.id) }}
              onDelete={(id) => deleteMutation.mutate(id)}
            />
          )
        )}

        {adding ? (
          <CategoryForm
            onSave={(data) => createMutation.mutate(data)}
            onCancel={() => setAdding(false)}
          />
        ) : (
          <button
            onClick={() => { setEditingId(null); setAdding(true) }}
            className="flex items-center gap-2 w-full p-3 border-2 border-dashed border-gray-200 rounded-lg text-sm text-gray-400 hover:border-app-accent hover:text-app-accent transition-colors"
          >
            <Plus size={16} /> Add category
          </button>
        )}
      </div>
    </div>
  )
}

export default function SettingsPage() {
  const qc = useQueryClient()
  const { data } = useQuery({
    queryKey: ['settings'],
    queryFn: () => getSettings().then((r) => r.data),
  })

  const [day, setDay] = useState('')

  useEffect(() => {
    if (data) setDay(String(data.cycle_start_day))
  }, [data])

  const saveMutation = useMutation({
    mutationFn: () => updateSettings({ cycle_start_day: Number(day) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings'] })
    },
  })

  const dayNum = Number(day)
  const preview =
    day && dayNum >= 1 && dayNum <= 28
      ? (() => {
          const now = new Date()
          const start = new Date(now.getFullYear(), now.getMonth(), dayNum)
          const end = new Date(now.getFullYear(), now.getMonth() + 1, dayNum - 1)
          return `e.g. your ${format(start, 'MMMM')} cycle runs ${format(start, 'MMM d')} – ${format(end, 'MMM d')}`
        })()
      : null

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800">Settings</h2>

      <div className="bg-white rounded-2xl p-6 shadow-sm max-w-md">
        <h3 className="font-semibold text-gray-700 mb-5">Budget Cycle</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Cycle starts on day
            </label>
            <input
              type="number"
              min="1"
              max="28"
              value={day}
              onChange={(e) => {
                saveMutation.reset()
                setDay(e.target.value)
              }}
              className="w-24 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-app-accent"
            />
            {preview && (
              <p className="text-xs text-gray-400 mt-1">{preview}</p>
            )}
          </div>
          <button
            onClick={() => saveMutation.mutate()}
            disabled={!day || dayNum < 1 || dayNum > 28 || saveMutation.isPending}
            className="bg-app-accent text-white px-6 py-2 rounded-xl text-sm font-medium hover:bg-blue-600 disabled:opacity-50 transition-colors"
          >
            {saveMutation.isPending ? 'Saving…' : 'Save'}
          </button>
          {saveMutation.isSuccess && (
            <p className="text-sm text-app-success">Settings saved.</p>
          )}
          {saveMutation.isError && (
            <p className="text-sm text-app-danger">Failed to save. Please try again.</p>
          )}
        </div>
      </div>

      <CategoriesCard />
    </div>
  )
}
