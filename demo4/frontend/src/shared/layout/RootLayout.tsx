import { Outlet } from 'react-router'
import { Header } from './Header'
import styles from './RootLayout.module.css'

export function RootLayout() {
  return (
    <>
      <Header />
      <main className={styles.main}>
        <Outlet />
      </main>
    </>
  )
}
