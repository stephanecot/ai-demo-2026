/**
 * BandeauErreur — affiche le message d'erreur du backend, jamais un texte
 * générique. Le bouton de reprise est optionnel et local : `onReessayer`
 * relance le hook appelant, le composant ne sait rien de la requête.
 */
import { Icone } from './Icone';
import styles from './BandeauErreur.module.css';

export interface BandeauErreurProps {
  /** Message tel que renvoyé par l'API (`{ erreur: string }`). */
  readonly message: string;
  readonly onReessayer?: () => void;
  /** Libellé du bouton de reprise ; permet à l'écran d'imposer un texte de `labels.ts`. */
  readonly libelleReessayer?: string;
}

export function BandeauErreur({ message, onReessayer, libelleReessayer = 'Réessayer' }: BandeauErreurProps) {
  return (
    <div className={styles.bandeau} role="alert">
      <Icone nom="cercle-erreur" taille={16} />
      <p className={styles.message}>{message}</p>
      {onReessayer && (
        <button type="button" className={styles.bouton} onClick={onReessayer}>
          {libelleReessayer}
        </button>
      )}
    </div>
  );
}
