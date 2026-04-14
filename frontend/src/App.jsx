import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './contexts/AuthContext'
import { useTranslation } from './contexts/LanguageContext'
import ProtectedRoute from './components/layout/ProtectedRoute'
import TopNav from './components/layout/TopNav'
import MobileBottomNav from './components/layout/MobileBottomNav'
import LoginPage from './pages/LoginPage'
import OverviewPage from './pages/OverviewPage'
import PlanningPage from './pages/PlanningPage'
import TransactionsPage from './pages/TransactionsPage'
import ExportPage from './pages/ExportPage'
import SettingsPage from './pages/SettingsPage'

const queryClient = new QueryClient()

function Layout({ children }) {
  return (
    <div className="min-h-screen bg-app-bg pb-16 md:pb-0">
      <TopNav />
      <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>
      <MobileBottomNav />
    </div>
  )
}

export default function App() {
  const { lang } = useTranslation()

  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
    document.documentElement.lang = lang
  }, [lang])

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout><OverviewPage /></Layout>}     path="/" />
              <Route element={<Layout><PlanningPage /></Layout>}     path="/planning" />
              <Route element={<Layout><TransactionsPage /></Layout>} path="/transactions" />
              <Route element={<Layout><ExportPage /></Layout>}       path="/export" />
              <Route element={<Layout><SettingsPage /></Layout>}     path="/settings" />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}
