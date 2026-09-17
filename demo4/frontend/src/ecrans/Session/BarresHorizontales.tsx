/**
 * BarresHorizontales — « où part l'argent » (par outil, par agent) : barres
 * horizontales triées, la plus grosse en haut, jamais un camembert
 * (`references/graphiques.md`). Local à l'écran Session pour l'instant ;
 * `ModelesEtAgents` aura probablement besoin de la même forme plus tard —
 * à remonter dans `components/ui/` par qui construira cet écran.
 *
 * Une seule couleur de barre : le nom porte l'identité, pas une teinte
 * inventée par entité (§6 du plan, étendu ici à la couleur des barres).
 * Le composant ne connaît aucun tarif : `cout` et `appels` arrivent déjà
 * calculés ; seule la part en % (un rapport entre deux coûts déjà connus,
 * jamais un tarif appliqué à des tokens) est dérivée ici pour l'affichage.
 */
import { montantCourt, pourcentage } from '../../format';
import styles from './BarresHorizontales.module.css';

export interface EntreeBarre {
  readonly cle: string;
  readonly libelle: string;
  readonly appels: number;
  readonly cout: number;
}

export interface BarresHorizontalesProps {
  readonly entrees: readonly EntreeBarre[];
  readonly libelleAppels: (appels: number) => string;
}

export function BarresHorizontales({ entrees, libelleAppels }: BarresHorizontalesProps) {
  const triees = [...entrees].sort((a, b) => b.cout - a.cout);
  const total = triees.reduce((somme, entree) => somme + entree.cout, 0);
  const max = Math.max(...triees.map((entree) => entree.cout), 0.0001);

  return (
    <div className={styles.liste}>
      {triees.map((entree) => {
        const largeur = Math.max(0, Math.min(100, (entree.cout / max) * 100));
        const part = total > 0 ? (entree.cout / total) * 100 : 0;
        return (
          <div key={entree.cle} className={styles.ligne}>
            <span className={styles.libelle}>{entree.libelle}</span>
            <span className={styles.appels}>{libelleAppels(entree.appels)}</span>
            <span className={styles.piste}>
              <span className={styles.remplissage} style={{ width: `${largeur}%` }} />
            </span>
            <span className={styles.part}>{pourcentage(part, 0)}</span>
            <span className={styles.cout}>{montantCourt(entree.cout)}</span>
          </div>
        );
      })}
    </div>
  );
}
