/**
 * PanneauAlertes — les alertes récentes des budgets : date, icône de
 * sévérité, texte, et le libellé de sévérité à droite. Couleur et libellé
 * toujours ensemble, jamais la couleur seule.
 */
import { Icone, Panneau } from '../../components/ui';
import type { ToneEncart } from '../../components/ui';
import { date, heure } from '../../format';
import { BUDGETS, SEVERITES_ALERTE } from '../../labels';
import type { Alerte } from '../../types/api';
import { visuelSeverite } from './visuels';
import styles from './PanneauAlertes.module.css';

// Le « ?? '' » ne sert qu'à satisfaire l'index signature de vite/client sous
// `noUncheckedIndexedAccess` ; jamais atteint tant que la classe existe.
const classeTonalite: Record<ToneEncart, string> = {
  ok: styles.toneOk ?? '',
  vigilance: styles.toneVigilance ?? '',
  limite: styles.toneLimite ?? '',
  depassement: styles.toneDepassement ?? '',
};

export interface PanneauAlertesProps {
  readonly alertes: readonly Alerte[];
}

export function PanneauAlertes({ alertes }: PanneauAlertesProps) {
  return (
    <Panneau titre={BUDGETS.alertesRecentes}>
      <ul className={styles.liste}>
        {alertes.map((alerte) => {
          const visuel = visuelSeverite(alerte.severite);
          const classe = classeTonalite[visuel.tone];
          return (
            <li key={alerte.id} className={styles.ligne}>
              <span className={styles.date}>{`${date(alerte.horodatage)} · ${heure(alerte.horodatage)}`}</span>
              <span className={`${styles.icone} ${classe}`}>
                <Icone nom={visuel.icone} taille={14} />
              </span>
              <span className={styles.texte}>{alerte.texte}</span>
              <span className={`${styles.severite} ${classe}`}>{SEVERITES_ALERTE[alerte.severite]}</span>
            </li>
          );
        })}
      </ul>
    </Panneau>
  );
}
