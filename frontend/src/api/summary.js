import client from './client'

export const getSummary = (month) =>
  client.get('/api/summary/', { params: { month } })
