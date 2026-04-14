import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { getSettings } from '../api/settings'

export function useCycleSettings() {
  const { data } = useQuery({
    queryKey: ['settings'],
    queryFn: () => getSettings().then((r) => r.data),
  })

  const cycleStartDay = data?.cycle_start_day ?? 1

  function cycleRange(month) {
    // month = 'YYYY-MM'
    const [year, mon] = month.split('-').map(Number)
    const start = new Date(year, mon - 1, cycleStartDay)
    // end = same day next month minus 1 day
    // new Date(year, mon, 0) = last day of month `mon-1`
    // new Date(year, mon, cycleStartDay - 1) = day before next cycle start
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

  return { cycleStartDay, cycleRange }
}
