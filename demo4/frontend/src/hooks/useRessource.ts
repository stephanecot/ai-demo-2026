import { useCallback, useEffect, useRef, useState } from 'react';

/** Les quatre états obligatoires d'un hook de ressource — jamais un cinquième. */
export type StatutRessource = 'chargement' | 'pret' | 'vide' | 'erreur';

export interface EtatRessource<T> {
  readonly data: T | undefined;
  readonly statut: StatutRessource;
  readonly erreur: string | undefined;
  /** Relance le chargement sans attendre un changement de dépendance. */
  readonly recharger: () => void;
}

export interface OptionsRessource<T> {
  /**
   * Décide si une donnée chargée avec succès doit afficher l'état « vide »
   * plutôt que « prêt » (une liste vide, un résumé à zéro…). Omis, la
   * ressource ne connaît jamais l'état vide (cas d'un objet unique toujours
   * présent, comme `Sante` ou `Reglages`).
   */
  readonly estVide?: (data: T) => boolean;
}

/**
 * Hook générique qui charge une ressource via `chargeur(signal)` et expose ses
 * quatre états. Le chargement redémarre quand une valeur de `deps` change
 * (mêmes règles que le tableau de dépendances de `useEffect`), ou quand
 * `recharger()` est appelé. Toute requête obsolète est annulée via
 * `AbortController`, et aucun état n'est mis à jour après le démontage du
 * composant appelant.
 */
export function useRessource<T>(
  chargeur: (signal: AbortSignal) => Promise<T>,
  deps: readonly unknown[],
  options: OptionsRessource<T> = {},
): EtatRessource<T> {
  const [data, setData] = useState<T | undefined>(undefined);
  const [statut, setStatut] = useState<StatutRessource>('chargement');
  const [erreur, setErreur] = useState<string | undefined>(undefined);
  const [jeton, setJeton] = useState(0);

  // Les fonctions passées par les hooks de ressource sont recréées à chaque
  // rendu : on les lit depuis une ref pour ne pas les mettre dans le tableau
  // de dépendances de l'effet, qui doit rester piloté par `deps` et `jeton`.
  const chargeurRef = useRef(chargeur);
  chargeurRef.current = chargeur;
  const estVideRef = useRef(options.estVide);
  estVideRef.current = options.estVide;

  useEffect(() => {
    const controleur = new AbortController();
    let composantMonte = true;

    setStatut('chargement');
    setErreur(undefined);

    chargeurRef
      .current(controleur.signal)
      .then((resultat) => {
        if (!composantMonte) {
          return;
        }
        setData(resultat);
        const vide = estVideRef.current?.(resultat) ?? false;
        setStatut(vide ? 'vide' : 'pret');
      })
      .catch((cause: unknown) => {
        if (!composantMonte || controleur.signal.aborted) {
          return;
        }
        setErreur(cause instanceof Error ? cause.message : String(cause));
        setStatut('erreur');
      });

    return () => {
      composantMonte = false;
      controleur.abort();
    };
  }, [...deps, jeton]);

  const recharger = useCallback(() => {
    setJeton((precedent) => precedent + 1);
  }, []);

  return { data, statut, erreur, recharger };
}
