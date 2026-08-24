/**
 * Design-system barrel — the single entry point for the base components.
 *
 * CONVENTION: everything outside this folder imports from `components/ui`, never
 * from a file inside it (`components/ui/Card`). Inside the folder, siblings keep
 * importing each other by file to avoid a cycle through this barrel.
 */
export { Button } from './Button'
export { Card } from './Card'
export { EmptyState } from './EmptyState'
export { ErrorBanner } from './ErrorBanner'
export { Spinner } from './Spinner'
export { StatusBadge } from './StatusBadge'
