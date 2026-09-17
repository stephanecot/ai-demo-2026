/**
 * PiedDePage — mentions discrètes de bas d'écran : le rappel des tarifs et
 * la source active (« données d'exemple » quand `sante.source === 'exemple'`).
 */
import { useSante } from '../../hooks/useSante';
import { COMMUN } from '../../labels';
import styles from './PiedDePage.module.css';

export interface PiedDePageProps {
  /** Mention de gauche ; par défaut le rappel des tarifs commun aux écrans chiffrés. */
  readonly mention?: string;
}

export function PiedDePage({ mention = COMMUN.piedDePage.mentionTarifs }: PiedDePageProps) {
  const { data } = useSante();

  const sourceTexte =
    data?.source === 'exemple'
      ? COMMUN.piedDePage.sourceExemple
      : data?.source === 'transcripts'
        ? COMMUN.piedDePage.sourceTranscripts
        : undefined;

  return (
    <div className={styles.piedDePage}>
      <span className={styles.mention}>{mention}</span>
      {sourceTexte && <span className={styles.mention}>{sourceTexte}</span>}
    </div>
  );
}
