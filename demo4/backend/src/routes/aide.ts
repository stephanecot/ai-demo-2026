import { RequeteInvalide } from '../erreurs.js';

/**
 * Extrait un paramètre de requête attendu comme une chaîne unique.
 * `undefined` si absent ; lève une erreur 400 s'il est répété (tableau) ou
 * d'un type inattendu (objet imbriqué qu'Express peut produire pour
 * `?a[b]=1`).
 */
export function paramTexte(valeur: unknown, nomChamp: string): string | undefined {
  if (valeur === undefined) return undefined;
  if (typeof valeur !== 'string') {
    throw new RequeteInvalide(`Le paramètre « ${nomChamp} » doit être une chaîne unique.`);
  }
  return valeur;
}

/** Paramètre de route (`:id`) : toujours présent quand la route est appariée. */
export function paramRoute(valeur: string | undefined, nomChamp: string): string {
  if (valeur === undefined) {
    throw new RequeteInvalide(`Le paramètre « ${nomChamp} » est requis.`);
  }
  return valeur;
}
