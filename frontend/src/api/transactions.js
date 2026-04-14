import client from './client'

export const getTransactions = (month) =>
  client.get('/api/transactions/', { params: { month } })
export const createTransaction = (data) => client.post('/api/transactions/', data)
export const updateTransaction = (id, data) => client.patch(`/api/transactions/${id}/`, data)
export const deleteTransaction = (id) => client.delete(`/api/transactions/${id}/`)
