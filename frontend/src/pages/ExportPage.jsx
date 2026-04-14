import ExportForm from '../components/export/ExportForm'
import { useTranslation } from '../contexts/LanguageContext'

export default function ExportPage() {
  const { t } = useTranslation()
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800">{t('export_title')}</h2>
      <ExportForm />
    </div>
  )
}
