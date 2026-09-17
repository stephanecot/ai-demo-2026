/**
 * CarteBudget — une carte-bouton par budget : nom, portée, puce d'état
 * (icône + libellé), jauge à deux couches (consommé net, projection
 * fantôme) et les deux montants en dessous. Sélection au clic et au clavier
 * via un vrai `<button>` (`aria-pressed`).
 */
import { Badge, Jauge } from '../../components/ui';
import { montantCourt, pourcentage } from '../../format';
import { BUDGETS, ETATS_BUDGET } from '../../labels';
import type { EtatDuBudget } from '../../types/api';
import { visuelEtat } from './visuels';
import styles from './CarteBudget.module.css';

export interface CarteBudgetProps {
  readonly budget: EtatDuBudget;
  readonly selectionne: boolean;
  readonly onSelectionner: () => void;
}

export function CarteBudget({ budget, selectionne, onSelectionner }: CarteBudgetProps) {
  const visuel = visuelEtat(budget.etat);
  const libelleAccessible = `${budget.nom} : ${pourcentage(budget.pctConsomme, 0)} du plafond consommés, projection ${pourcentage(budget.pctProjection, 0)}`;

  return (
    <button
      type="button"
      className={selectionne ? `${styles.carte} ${styles.carteSelectionnee}` : styles.carte}
      aria-pressed={selectionne}
      onClick={onSelectionner}
    >
      <div className={styles.entete}>
        <div className={styles.nomEtPortee}>
          <span className={styles.nom}>{budget.nom}</span>
          <span className={styles.portee}>{budget.portee}</span>
        </div>
        <Badge tonalite={visuel.badge} icone={visuel.icone}>
          {ETATS_BUDGET[budget.etat]}
        </Badge>
      </div>

      <div>
        <Jauge
          valeur={budget.consomme}
          plafond={budget.plafond}
          projection={budget.projection}
          tonalite={visuel.tone}
          libelleAccessible={libelleAccessible}
        />
        <div className={styles.ligneChiffres}>
          <span className={styles.conso}>
            {BUDGETS.consommesEtProjection(montantCourt(budget.consomme), montantCourt(budget.projection))}
          </span>
          <span className={styles.plafond}>{BUDGETS.plafondLabel(montantCourt(budget.plafond))}</span>
        </div>
      </div>
    </button>
  );
}
