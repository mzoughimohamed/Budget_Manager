// frontend/src/components/planning/MonthPicker.jsx
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { format, addMonths, subMonths } from 'date-fns'

export default function MonthPicker({ value, onChange }) {
  const date = new Date(value + '-01')
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onChange(format(subMonths(date, 1), 'yyyy-MM'))}
        className="p-1 rounded hover:bg-gray-100"
      >
        <ChevronLeft size={18} />
      </button>
      <span className="text-sm font-semibold w-28 text-center">
        {format(date, 'MMMM yyyy')}
      </span>
      <button
        onClick={() => onChange(format(addMonths(date, 1), 'yyyy-MM'))}
        className="p-1 rounded hover:bg-gray-100"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  )
}
