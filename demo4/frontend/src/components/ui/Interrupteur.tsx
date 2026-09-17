/**
 * Interrupteur — bascule on/off avec libellé cliquable.
 *
 * `role="switch"` porté par un vrai `<button>` : l'activation au clavier
 * (Entrée, Espace) est native, aucun gestionnaire de touche à écrire.
 */
import styles from './Interrupteur.module.css';

export interface InterrupteurProps {
  readonly actif: boolean;
  readonly libelle: string;
  readonly detail?: string;
  readonly onChange: (actif: boolean) => void;
}

export function Interrupteur({ actif, libelle, detail, onChange }: InterrupteurProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={actif}
      className={styles.interrupteur}
      onClick={() => onChange(!actif)}
    >
      <span className={actif ? `${styles.piste} ${styles.pisteActif}` : styles.piste}>
        <span className={actif ? `${styles.molette} ${styles.moletteActive}` : styles.molette} />
      </span>
      <span className={styles.texte}>
        <span className={styles.libelle}>{libelle}</span>
        {detail === undefined ? null : <span className={styles.detail}>{detail}</span>}
      </span>
    </button>
  );
}
