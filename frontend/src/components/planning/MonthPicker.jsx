import { ChevronLeft, ChevronRight } from 'lucide-react'
import { format, addMonths, subMonths } from 'date-fns'

export default function MonthPicker({ value, onChange, cycleLabel }) {
  const date = new Date(value + '-01')
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onChange(format(subMonths(date, 1), 'yyyy-MM'))}
        className="p-1 rounded hover:bg-gray-100"
      >
        <ChevronLeft size={18} />
      </button>
      <div className="flex flex-col items-center w-32">
        <span className="text-sm font-semibold text-center">
          {format(date, 'MMMM yyyy')}
        </span>
        {cycleLabel && (
          <span className="text-xs text-gray-400">{cycleLabel}</span>
        )}
      </div>
      <button
        onClick={() => onChange(format(addMonths(date, 1), 'yyyy-MM'))}
        className="p-1 rounded hover:bg-gray-100"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  )
}
