import client from './client'

export const getSummary = ({ start, end, month }) =>
  client.get('/api/summary/', { params: { start, end, month } })
