import { USER_ROLE_LABELS } from '../../labels'
import { useCurrentUser } from '../../hooks/currentUserContext'
import './UserMenu.css'

/**
 * Demo profile picker. Stubbed authentication: choosing a profile is the whole login.
 * A real login screen arrives with US-001; this is the header half of it.
 */
export function UserMenu() {
  const { currentUser, users, status, error, selectUser } = useCurrentUser()

  if (status === 'loading') {
    return <span className="user-menu__hint">Chargement des profils…</span>
  }
  if (status === 'error') {
    return (
      <span className="user-menu__hint" role="alert">
        {error ?? 'Profils indisponibles.'}
      </span>
    )
  }

  return (
    <div className="user-menu">
      <label className="user-menu__label" htmlFor="user-menu-select">
        Profil
      </label>
      <select
        id="user-menu-select"
        className="user-menu__select"
        value={currentUser === null ? '' : String(currentUser.id)}
        onChange={(event) => {
          selectUser(event.target.value === '' ? null : Number(event.target.value))
        }}
      >
        <option value="">Choisir un profil…</option>
        {users.map((user) => (
          <option key={user.id} value={user.id}>
            {user.name} — {USER_ROLE_LABELS[user.role]}
          </option>
        ))}
      </select>
    </div>
  )
}
