/**
 * RepartitionModele — pièce locale au Tableau de bord : barre segmentée +
 * légende chiffrée de la répartition d'un projet par modèle. Le design
 * system n'a pas de composant pour une barre horizontale à trois segments
 * proportionnels (voir `composants.md`) ; c'est un local du dossier d'écran,
 * pas une modification du design system.
 *
 * Reçoit le coût déjà calculé par modèle (`LigneProjet.parModele`, en
 * dollars) et le coût total du projet : la seule arithmétique faite ici est
 * la proportion d'affichage (largeur du segment), la même opération que
 * `Jauge` ou `BarresEmpilees` font déjà en interne pour se dessiner.
 */
import { Pastille } from '../../components/ui';
import { montant } from '../../format';
import { MODELES } from '../../labels';
import type { ModeleId } from '../../types/api';
import { COULEUR_MODELE_VAR, ORDRE_MODELES } from './modeles';
import styles from './RepartitionModele.module.css';

export interface RepartitionModeleProps {
  readonly titre: string;
  readonly parModele: Readonly<Record<ModeleId, number>>;
  readonly total: number;
}

function largeurSegment(valeur: number, total: number): string {
  if (total <= 0) {
    return '0%';
  }
  return `${Math.min(100, Math.max(0, (valeur / total) * 100))}%`;
}

export function RepartitionModele({ titre, parModele, total }: RepartitionModeleProps) {
  return (
    <div>
      <div className={styles.titre}>{titre}</div>
      <div className={styles.barre} role="img" aria-label={titre}>
        {ORDRE_MODELES.map((modele) => (
          <div
            key={modele}
            className={styles.segment}
            style={{ width: largeurSegment(parModele[modele], total), background: COULEUR_MODELE_VAR[modele] }}
          />
        ))}
      </div>
      <ul className={styles.legende}>
        {ORDRE_MODELES.map((modele) => (
          <li key={modele} className={styles.ligne}>
            <Pastille couleur={COULEUR_MODELE_VAR[modele]} />
            <span className={styles.libelle}>{MODELES[modele]}</span>
            <span className={styles.valeur}>{montant(parModele[modele])}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
