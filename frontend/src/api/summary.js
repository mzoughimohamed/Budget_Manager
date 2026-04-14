import client from './client'

// `month` (YYYY-MM) is used by the backend to look up income sources,
// which remain calendar-month-scoped; start/end filter the expenses range.
export const getSummary = ({ start, end, month }) =>
  client.get('/api/summary/', { params: { start, end, month } })
