import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthContext } from '../contexts/AuthContext'
import ProtectedRoute from '../components/layout/ProtectedRoute'

function wrap(user, loading = false) {
  return (
    <AuthContext.Provider value={{ user, loading }}>
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route path="/login" element={<div>Login Page</div>} />
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<div>Dashboard</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  )
}

test('renders children when authenticated', () => {
  render(wrap('admin'))
  expect(screen.getByText('Dashboard')).toBeInTheDocument()
})

test('redirects to login when unauthenticated', () => {
  render(wrap(null))
  expect(screen.getByText('Login Page')).toBeInTheDocument()
})
