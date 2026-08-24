import { Route, Routes } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { HomePage } from './pages/HomePage'
import { NotFoundPage } from './pages/NotFoundPage'

/**
 * Shell + routes. The router itself is mounted in `main.tsx` (`BrowserRouter`) so
 * that tests can mount the same tree under a `MemoryRouter` on any entry path.
 */
export function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<HomePage />} />
        {/* US-001: /connexion — US-002: /cra — US-004: /missions … */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AppShell>
  )
}
