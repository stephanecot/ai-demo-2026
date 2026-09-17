/**
 * TuileCache — variante locale de `Tuile` pour « part servie par le cache ».
 *
 * `ui/Tuile` ne connaît que les tons neutre/accent/états de budget (voir
 * `composants.md`) ; ce chiffre-ci porte le vert du modèle Haiku (règle de
 * mission de l'écran), pas un état de budget. Plutôt que d'ajouter un ton
 * « modèle » au composant partagé, on compose localement la même anatomie
 * (micro-label, chiffre mono tabulaire, ligne secondaire) avec le token
 * `--modele-haiku` — un composant local pour une pièce qui manque au design
 * system, comme le prescrit son skill.
 */
import { Icone } from '../../components/ui';
import styles from './TuileCache.module.css';

export interface TuileCacheProps {
  readonly libelle: string;
  readonly valeur: string;
  readonly montantEvite: string;
  readonly libelleEvites: string;
}

export function TuileCache({ libelle, valeur, montantEvite, libelleEvites }: TuileCacheProps) {
  return (
    <div className={styles.tuile}>
      <div className={styles.libelle}>{libelle}</div>
      <div className={styles.valeur}>{valeur}</div>
      <div className={styles.ligneEvites}>
        <Icone nom="coche" taille={12} />
        <span className={styles.montantEvite}>{montantEvite}</span>
        <span className={styles.libelleEvites}>{libelleEvites}</span>
      </div>
    </div>
  );
}
