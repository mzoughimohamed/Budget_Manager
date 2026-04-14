import client from './client'

export const getTransactions = ({ start, end }) =>
  client.get('/api/transactions/', { params: { start, end } })
export const createTransaction = (data) => client.post('/api/transactions/', data)
export const updateTransaction = (id, data) => client.patch(`/api/transactions/${id}/`, data)
export const deleteTransaction = (id) => client.delete(`/api/transactions/${id}/`)
