import client from './client'

export const login = (username, password) =>
  client.post('/api/auth/login/', { username, password })

export const logout = () =>
  client.post('/api/auth/logout/')

export const getMe = () =>
  client.get('/api/auth/me/')
