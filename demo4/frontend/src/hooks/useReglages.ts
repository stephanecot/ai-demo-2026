import { recupereReglages } from '../api/reglages';
import type { Reglages } from '../types/api';
import { useRessource } from './useRessource';
import type { EtatRessource } from './useRessource';

/** `Reglages` est un objet unique toujours présent : jamais d'état « vide ». */
export function useReglages(): EtatRessource<Reglages> {
  return useRessource<Reglages>((signal) => recupereReglages(signal), []);
}
