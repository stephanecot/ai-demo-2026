import { Route, Routes } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { CurrentUserProvider } from './hooks/CurrentUserProvider'
import { HomePage } from './pages/HomePage'
import { MissionsPage } from './pages/MissionsPage'
import { NotFoundPage } from './pages/NotFoundPage'

/**
 * Shell + routes. The router itself is mounted in `main.tsx` (`BrowserRouter`) so
 * that tests can mount the same tree under a `MemoryRouter` on any entry path.
 */
export function App() {
  return (
    <CurrentUserProvider>
      <AppShell>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/missions" element={<MissionsPage />} />
          {/* US-001: /connexion — US-007→013: /cra — US-014→016: /validation */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AppShell>
    </CurrentUserProvider>
  )
}
