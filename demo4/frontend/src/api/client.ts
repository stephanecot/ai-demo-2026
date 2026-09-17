/**
 * Le seul `fetch` du produit.
 *
 * Construit l'URL sous `/api`, sérialise les paramètres de requête (une valeur
 * `undefined` est omise, jamais envoyée comme la chaîne `"undefined"`), et sur
 * une réponse non-ok lit le champ `erreur` du corps JSON pour lever une erreur
 * qui porte le message du backend (§4.3 du plan) — jamais un texte générique.
 *
 * Chaque fichier de `src/api/` expose une fonction par endpoint qui appelle
 * `requeteApi` ou `requeteApiTexte` ; aucun autre fichier du produit n'appelle
 * `fetch` directement.
 */

/** Valeurs de paramètres de requête ; `undefined` signifie « paramètre absent ». */
export type ParametresRequete = Readonly<Record<string, string | number | undefined>>;

interface CorpsErreur {
  readonly erreur?: string;
}

function construitUrl(chemin: string, parametres?: ParametresRequete): string {
  const base = `/api${chemin}`;
  if (!parametres) {
    return base;
  }
  const recherche = new URLSearchParams();
  for (const [cle, valeur] of Object.entries(parametres)) {
    if (valeur !== undefined) {
      recherche.set(cle, String(valeur));
    }
  }
  const chaine = recherche.toString();
  return chaine ? `${base}?${chaine}` : base;
}

/** Lit le message d'erreur porté par le backend ; retombe sur le statut HTTP s'il est absent. */
async function messageErreur(reponse: Response): Promise<string> {
  try {
    const corps = (await reponse.json()) as CorpsErreur;
    if (typeof corps.erreur === 'string' && corps.erreur.length > 0) {
      return corps.erreur;
    }
  } catch {
    // Corps non JSON ou vide : on retombe sur le statut HTTP ci-dessous.
  }
  return `Le serveur a répondu avec le statut ${reponse.status}.`;
}

/** Requête `GET` : retourne le corps JSON typé. */
export async function requeteApi<T>(
  chemin: string,
  parametres?: ParametresRequete,
  signal?: AbortSignal,
): Promise<T> {
  const reponse = await fetch(construitUrl(chemin, parametres), {
    method: 'GET',
    ...(signal !== undefined ? { signal } : {}),
  });
  if (!reponse.ok) {
    throw new Error(await messageErreur(reponse));
  }
  return (await reponse.json()) as T;
}

/** Requête `PATCH` : envoie `corps` en JSON, retourne le corps JSON typé de la réponse. */
export async function requeteApiPatch<T>(chemin: string, corps: unknown, signal?: AbortSignal): Promise<T> {
  const reponse = await fetch(construitUrl(chemin), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(corps),
    ...(signal !== undefined ? { signal } : {}),
  });
  if (!reponse.ok) {
    throw new Error(await messageErreur(reponse));
  }
  return (await reponse.json()) as T;
}

/** Requête `GET` dont la réponse est du texte brut (l'export CSV). */
export async function requeteApiTexte(
  chemin: string,
  parametres?: ParametresRequete,
  signal?: AbortSignal,
): Promise<string> {
  const reponse = await fetch(construitUrl(chemin, parametres), {
    method: 'GET',
    ...(signal !== undefined ? { signal } : {}),
  });
  if (!reponse.ok) {
    throw new Error(await messageErreur(reponse));
  }
  return reponse.text();
}
