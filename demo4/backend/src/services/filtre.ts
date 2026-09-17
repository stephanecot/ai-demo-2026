import { jourDe } from '../domain/agregation.js';
import type { Session } from '../types.js';

/**
 * Filtre partagé par les services d'agrégation (résumé, projets, agents,
 * export) : ne garde, pour chaque session, que les tours dont le jour tombe
 * dans `[debut, fin]` (bornes inclusives, format `AAAA-MM-JJ`). Une session
 * qui n'a plus aucun tour après filtrage est retirée : elle n'a pas d'activité
 * sur la période, elle ne doit pas gonfler un compte de sessions à 0 $.
 *
 * On filtre au niveau du tour (pas de la session) pour que l'agrégation par
 * jour (`domain/agregation.ts#parJour`) ne fasse jamais apparaître un jour
 * hors de la période demandée : c'est ce qui garantit l'invariant « total
 * période = somme des jours ».
 */
export function sessionsDansLaPeriode(sessions: readonly Session[], debut: string, fin: string): Session[] {
  const resultat: Session[] = [];
  for (const session of sessions) {
    const tours = session.tours.filter((tour) => {
      const jour = jourDe(tour.horodatage);
      return jour >= debut && jour <= fin;
    });
    if (tours.length > 0) {
      resultat.push({ ...session, tours });
    }
  }
  return resultat;
}
