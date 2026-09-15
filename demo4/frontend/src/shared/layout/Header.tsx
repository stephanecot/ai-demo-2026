import { Link } from 'react-router'
import { buttonClassName } from '../ui'
import styles from './Header.module.css'

export function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link to="/" className={styles.logo} aria-label="leboncoin, accueil">
          leboncoin
        </Link>
        <form className={styles.search} role="search" onSubmit={(event) => event.preventDefault()}>
          <input
            type="search"
            className={styles.searchInput}
            placeholder="Rechercher sur leboncoin"
            aria-label="Rechercher sur leboncoin"
          />
        </form>
        <Link to="/deposer" className={buttonClassName('primary', styles.deposit)}>
          Déposer une annonce
        </Link>
      </div>
    </header>
  )
}
