import client from './client'

export const getIncomeSources = (month) =>
  client.get('/api/income-sources/', { params: { month } })
export const createIncomeSource = (data) => client.post('/api/income-sources/', data)
export const updateIncomeSource = (id, data) => client.patch(`/api/income-sources/${id}/`, data)
export const deleteIncomeSource = (id) => client.delete(`/api/income-sources/${id}/`)
