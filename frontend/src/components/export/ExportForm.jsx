import { useState } from 'react'
import { format } from 'date-fns'
import { FileText, Table2 } from 'lucide-react'
import client from '../../api/client'
import { useCycleSettings } from '../../hooks/useCycleSettings'
import { useTranslation } from '../../contexts/LanguageContext'

export default function ExportForm() {
  const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'))
  const [loading, setLoading] = useState(null)
  const { cycleRange } = useCycleSettings()
  const { t } = useTranslation()

  const handleExport = async (formatType) => {
    setLoading(formatType)
    const { start, end } = cycleRange(month)
    try {
      const response = await client.get(`/api/export/${formatType}/`, {
        params: { start, end },
        responseType: 'blob',
      })
      const ext = formatType === 'csv' ? 'csv' : 'pdf'
      const url = URL.createObjectURL(response.data)
      const a = document.createElement('a')
      a.href = url
      a.download = `budget-${start}.${ext}`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm max-w-md">
      <h3 className="font-semibold text-gray-700 mb-5">{t('export_card_title')}</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">{t('export_month')}</label>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-app-accent"
          />
        </div>
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            onClick={() => handleExport('csv')}
            disabled={!!loading}
            className="flex items-center justify-center gap-2 border-2 border-app-accent text-app-accent py-3 rounded-xl font-medium hover:bg-blue-50 transition-colors disabled:opacity-50"
          >
            {loading === 'csv' ? t('export_generating') : <><Table2 size={18} /> CSV</>}
          </button>
          <button
            onClick={() => handleExport('pdf')}
            disabled={!!loading}
            className="flex items-center justify-center gap-2 bg-app-accent text-white py-3 rounded-xl font-medium hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            {loading === 'pdf' ? t('export_generating') : <><FileText size={18} /> PDF</>}
          </button>
        </div>
      </div>
    </div>
  )
}
