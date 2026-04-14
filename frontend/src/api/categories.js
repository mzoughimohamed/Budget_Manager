import client from './client'

export const getCategories = () => client.get('/api/categories/')
export const createCategory = (data) => client.post('/api/categories/', data)
export const updateCategory = (id, data) => client.patch(`/api/categories/${id}/`, data)
export const deleteCategory = (id) => client.delete(`/api/categories/${id}/`)
