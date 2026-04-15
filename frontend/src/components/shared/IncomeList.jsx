import { format } from 'date-fns'
import { useTranslation } from '../../contexts/LanguageContext'

export default function IncomeList({ transactions }) {
  const { t } = useTranslation()

  const incomes = [...transactions]
    .filter((tx) => tx.type === 'income')
    .sort((a, b) => b.date.localeCompare(a.date))

  const total = incomes.reduce((sum, tx) => sum + Number(tx.amount), 0)

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm">
      <h3 className="font-semibold text-gray-700 mb-4">{t('income_received_title')}</h3>
      <div className="space-y-3">
        {incomes.length === 0 ? (
          <p className="text-sm text-gray-400">{t('income_received_empty')}</p>
        ) : (
          <>
            {incomes.map((tx) => (
              <div key={tx.id} className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-600">
                    {format(new Date(tx.date + 'T00:00:00'), 'MMM d')}
                  </p>
                  {tx.note && <p className="text-xs text-gray-400">{tx.note}</p>}
                </div>
                <span className="text-sm font-semibold text-app-success">
                  +{Number(tx.amount).toLocaleString('fr-TN')} TND
                </span>
              </div>
            ))}
            <div className="border-t pt-3 flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">{t('income_received_total')}</span>
              <span className="text-sm font-bold text-app-success">
                +{total.toLocaleString('fr-TN')} TND
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
