/**
 * PostesChers — pièce locale au Tableau de bord : les trois postes de
 * dépense les plus chers d'un projet, en barres horizontales triées (voir
 * `graphiques.md` §1 — « où part l'argent » se lit en barres horizontales,
 * jamais un camembert). Absente du design system (`composants.md` ne liste
 * pas de barre horizontale simple) : composant local, pas une modification
 * du design system.
 *
 * `postes` arrive déjà trié et limité à trois éléments par le backend
 * (`LigneProjet.postes`). La seule arithmétique ici est la longueur de la
 * barre relative au poste le plus cher des trois, la même proportion
 * d'affichage que `Jauge` calcule déjà en interne.
 */
import type { Poste } from '../../types/api';
import { montant } from '../../format';
import styles from './PostesChers.module.css';

export interface PostesChersProps {
  readonly titre: string;
  readonly postes: readonly Poste[];
}

function largeurBarre(cout: number, max: number): string {
  if (max <= 0) {
    return '0%';
  }
  return `${Math.min(100, Math.max(0, (cout / max) * 100))}%`;
}

export function PostesChers({ titre, postes }: PostesChersProps) {
  const max = postes.reduce((plusGrand, poste) => Math.max(plusGrand, poste.cout), 0);

  return (
    <div className={styles.bloc}>
      <div className={styles.titre}>{titre}</div>
      <ul className={styles.liste}>
        {postes.map((poste) => (
          <li key={poste.label} className={styles.ligne}>
            <span className={styles.libelle}>{poste.label}</span>
            <span className={styles.piste} role="img" aria-label={`${poste.label} : ${montant(poste.cout)}`}>
              <span className={styles.remplissage} style={{ width: largeurBarre(poste.cout, max) }} />
            </span>
            <span className={styles.valeur}>{montant(poste.cout)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
