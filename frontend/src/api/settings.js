import client from './client'

export const getSettings = () => client.get('/api/settings/')
export const updateSettings = (data) => client.patch('/api/settings/', data)
