// frontend/src/components/overview/StatsRow.jsx
import { TrendingUp, TrendingDown, PiggyBank } from 'lucide-react'

function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm flex items-center gap-4">
      <div className={`rounded-full p-3 ${color}`}>
        <Icon size={20} className="text-white" />
      </div>
      <div>
        <p className="text-xs text-gray-500 mb-0.5">{label}</p>
        <p className="text-xl font-bold text-gray-800">{value} TND</p>
      </div>
    </div>
  )
}

export default function StatsRow({ totalIncome, totalExpenses, netSavings }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <StatCard
        label="Income"
        value={Number(totalIncome).toLocaleString('fr-TN')}
        icon={TrendingUp}
        color="bg-app-success"
      />
      <StatCard
        label="Expenses"
        value={Number(totalExpenses).toLocaleString('fr-TN')}
        icon={TrendingDown}
        color="bg-app-danger"
      />
      <StatCard
        label="Net Savings"
        value={Number(netSavings).toLocaleString('fr-TN')}
        icon={PiggyBank}
        color="bg-app-accent"
      />
    </div>
  )
}
