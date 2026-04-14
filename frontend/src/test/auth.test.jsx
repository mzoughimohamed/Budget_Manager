import { render, screen, waitFor } from '@testing-library/react'
import { AuthProvider, useAuth } from '../contexts/AuthContext'

function TestComponent() {
  const { user, loading } = useAuth()
  if (loading) return <div>Loading</div>
  return <div>{user ? `Logged in as ${user}` : 'Not logged in'}</div>
}

test('shows not logged in when unauthenticated', async () => {
  // Mock axios to simulate 403 from /api/auth/me/
  vi.mock('../api/auth', () => ({
    getMe: vi.fn().mockRejectedValue({ response: { status: 403 } }),
  }))
  render(<AuthProvider><TestComponent /></AuthProvider>)
  await waitFor(() => {
    expect(screen.getByText('Not logged in')).toBeInTheDocument()
  })
})
