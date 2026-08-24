import type { ReactNode } from 'react'
import { Header } from './Header'
import './AppShell.css'

type Props = {
  children: ReactNode
}

/** Fixed header + centred content, max-width 1200 px. */
export function AppShell({ children }: Props) {
  return (
    <div className="app-shell">
      <Header />
      <main className="app-shell__main">{children}</main>
    </div>
  )
}
