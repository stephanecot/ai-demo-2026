import { recupereSession } from '../api/sessions';
import type { DetailSession } from '../types/api';
import { useRessource } from './useRessource';
import type { EtatRessource } from './useRessource';

/** Le détail d'une session par son identifiant. Introuvable : le backend répond 404 → état erreur. */
export function useSession(id: string): EtatRessource<DetailSession> {
  return useRessource<DetailSession>((signal) => recupereSession(id, signal), [id]);
}
