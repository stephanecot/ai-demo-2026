/**
 * TableauTours — l'onglet « Tours » du détail de session : un tableau dont
 * une ligne se déplie au clic pour montrer les quatre postes de tokens.
 * Local à l'écran Session : le générique `Tableau` de `components/ui` ne
 * modélise pas de ligne dépliable, ce tableau reproduit son langage visuel
 * (grille, micro-labels, survol) pour ce seul besoin.
 *
 * Aucun tarif n'est appliqué ici : les tokens viennent de `usage` (le
 * compteur brut facturé) et le tarif par million vient de `/api/reglages`
 * (déjà calculé côté backend) — jamais multiplié pour obtenir un coût.
 */
import { Badge, Pastille } from '../../components/ui';
import { montantCourt } from '../../format';
import { MODELES, REGLAGES, SESSION } from '../../labels';
import type { DetailTour, ModeleId, Tarif } from '../../types/api';
import styles from './TableauTours.module.css';

export interface TableauToursProps {
  readonly tours: readonly DetailTour[];
  /** Index (position dans `tours`) de la ligne dépliée, s'il y en a une. */
  readonly ouvert: number | undefined;
  readonly onBasculer: (index: number) => void;
  /** Tarif par modèle, tel que renvoyé par `/api/reglages` — jamais recalculé. */
  readonly tarifs: ReadonlyMap<ModeleId, Tarif> | undefined;
}

const GABARIT = '32px 108px 78px 100px 1fr 150px 84px';

const CLES_POSTE = ['entree', 'sortie', 'cacheEcriture', 'cacheLecture'] as const;
type ClePoste = (typeof CLES_POSTE)[number];

const LIBELLES_POSTE: Record<ClePoste, string> = {
  entree: REGLAGES.colonneEntree,
  sortie: REGLAGES.colonneSortie,
  cacheEcriture: REGLAGES.colonneCacheEcriture,
  cacheLecture: REGLAGES.colonneCacheLecture,
};

const TONALITE_MODELE: Record<ModeleId, string> = {
  'claude-opus-5': 'var(--modele-opus)',
  'claude-sonnet-5': 'var(--modele-sonnet)',
  'claude-haiku-4-5': 'var(--modele-haiku)',
};

function texteTokens(tour: DetailTour): string {
  const { usage } = tour;
  return `${montantCourt(usage.entree)} / ${montantCourt(usage.sortie)} / ${montantCourt(usage.cacheEcriture + usage.cacheLecture)}`;
}

export function TableauTours({ tours, ouvert, onBasculer, tarifs }: TableauToursProps) {
  return (
    <div className={styles.tableau} role="table">
      <div className={styles.entete} role="row" style={{ gridTemplateColumns: GABARIT }}>
        <span role="columnheader">{SESSION.tableauTours.numero}</span>
        <span role="columnheader">{SESSION.tableauTours.agent}</span>
        <span role="columnheader">{SESSION.tableauTours.outil}</span>
        <span role="columnheader">{SESSION.tableauTours.modele}</span>
        <span role="columnheader">{SESSION.tableauTours.action}</span>
        <span role="columnheader">{SESSION.tableauTours.tokens}</span>
        <span role="columnheader" className={styles.enTeteNumerique}>
          {SESSION.tableauTours.cout}
        </span>
      </div>

      <div role="rowgroup">
        {tours.map((tour, index) => {
          const estOuvert = ouvert === index;
          const tarif = tarifs?.get(tour.modele);

          return (
            <div key={tour.index}>
              <button
                type="button"
                className={estOuvert ? `${styles.ligne} ${styles.ligneOuverte}` : styles.ligne}
                style={{ gridTemplateColumns: GABARIT }}
                aria-expanded={estOuvert}
                onClick={() => onBasculer(index)}
              >
                <span className={styles.numero}>{index + 1}</span>
                <span>
                  <Badge tonalite="neutre">{tour.agent}</Badge>
                </span>
                <span className={styles.outil}>{tour.outil}</span>
                <span className={styles.celluleModele}>
                  <Pastille couleur={TONALITE_MODELE[tour.modele]} />
                  <span className={styles.texteModele}>{MODELES[tour.modele]}</span>
                </span>
                <span className={styles.action}>{tour.libelle}</span>
                <span className={styles.tokens}>{texteTokens(tour)}</span>
                <span className={styles.cout}>{montantCourt(tour.cout)}</span>
              </button>

              {estOuvert && (
                <div className={styles.detail}>
                  <div className={styles.postes}>
                    {CLES_POSTE.map((cle) => (
                      <div key={cle} className={styles.poste}>
                        <div className={styles.posteLibelle}>{LIBELLES_POSTE[cle]}</div>
                        <div className={styles.posteValeur}>{montantCourt(tour.usage[cle])}</div>
                        {tarif && (
                          <div className={styles.posteTarif}>
                            {montantCourt(tarif[cle])} {REGLAGES.uniteTarif}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
