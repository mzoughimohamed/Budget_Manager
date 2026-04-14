import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { getSettings } from '../api/settings'

export function useCycleSettings() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['settings'],
    queryFn: () => getSettings().then((r) => r.data),
  })

  const cycleStartDay = data?.cycle_start_day ?? 1

  function cycleRange(month) {
    // month = 'YYYY-MM'
    const [year, mon] = month.split('-').map(Number)
    const start = new Date(year, mon - 1, cycleStartDay)
    // day argument (cycleStartDay - 1) rolls JS back to the day before
    // the next cycle start; when cycleStartDay=1 this equals new Date(year, mon, 0)
    // which is the last day of the current month
    const endDate = new Date(year, mon, cycleStartDay - 1)
    const startStr = format(start, 'yyyy-MM-dd')
    const endStr = format(endDate, 'yyyy-MM-dd')
    return {
      start: startStr,
      end: endStr,
      // null when cycleStartDay=1 so MonthPicker hides the subtitle
      label: cycleStartDay === 1
        ? null
        : `${format(start, 'MMM d')} – ${format(endDate, 'MMM d')}`,
    }
  }

  return { cycleStartDay, cycleRange, isLoading, error }
}
