import { recupereSante } from '../api/sante';
import type { Sante } from '../types/api';
import { useRessource } from './useRessource';
import type { EtatRessource } from './useRessource';

/** `Sante` est un objet unique toujours présent : jamais d'état « vide ». */
export function useSante(): EtatRessource<Sante> {
  return useRessource<Sante>((signal) => recupereSante(signal), []);
}
