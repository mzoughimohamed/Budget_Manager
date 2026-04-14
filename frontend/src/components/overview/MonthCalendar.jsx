// frontend/src/components/overview/MonthCalendar.jsx
import { useState } from 'react'
import {
  startOfMonth, endOfMonth, eachDayOfInterval,
  startOfWeek, endOfWeek, format, isSameMonth
} from 'date-fns'
import DayPanel from './DayPanel'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function MonthCalendar({ transactions, month }) {
  const [selectedDate, setSelectedDate] = useState(null)

  const monthDate = new Date(month + '-01')
  const start = startOfWeek(startOfMonth(monthDate))
  const end = endOfWeek(endOfMonth(monthDate))
  const days = eachDayOfInterval({ start, end })

  const txDates = new Set(transactions.map((tx) => tx.date))

  const handleAddTransaction = (date) => {
    setSelectedDate(null)
    window.location.href = `/transactions?date=${date}`
  }

  return (
    <>
      <div className="bg-white rounded-2xl p-5 shadow-sm">
        <h3 className="font-semibold text-gray-700 mb-4">Calendar</h3>
        <div className="grid grid-cols-7 gap-1 mb-2">
          {DAYS.map((d) => (
            <div key={d} className="text-center text-xs text-gray-400 font-medium py-1">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => {
            const dateStr = format(day, 'yyyy-MM-dd')
            const inMonth = isSameMonth(day, monthDate)
            const hasTransactions = txDates.has(dateStr)
            return (
              <button
                key={dateStr}
                onClick={() => inMonth && setSelectedDate(dateStr)}
                className={`
                  relative aspect-square flex items-center justify-center rounded-lg text-sm transition-colors
                  ${!inMonth ? 'text-gray-300 cursor-default' : 'hover:bg-blue-50 cursor-pointer'}
                  ${hasTransactions && inMonth ? 'font-semibold text-app-accent' : ''}
                `}
              >
                {format(day, 'd')}
                {hasTransactions && inMonth && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-app-accent" />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {selectedDate && (
        <DayPanel
          date={selectedDate}
          transactions={transactions}
          onClose={() => setSelectedDate(null)}
          onAddTransaction={handleAddTransaction}
        />
      )}
    </>
  )
}
