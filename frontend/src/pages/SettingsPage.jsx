import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getSettings, updateSettings } from '../api/settings'

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
    </div>
  )
}
