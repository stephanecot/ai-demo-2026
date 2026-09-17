/**
 * Erreurs typées du produit. Le middleware d'erreur les traduit en
 * `{ "erreur": "<message>" }` avec le code porté par `statut`.
 * Les messages sont fournis par l'appelant : en français, avec un point final,
 * et sans jamais exposer un chemin absolu du disque.
 */
export abstract class ErreurHttp extends Error {
  /** Code HTTP à renvoyer pour cette erreur. */
  abstract readonly statut: number;
}

/** Paramètre mal formé ou hors bornes : date illisible, `fin` avant `debut`, plafond invalide. */
export class RequeteInvalide extends ErreurHttp {
  readonly statut: number = 400;

  constructor(message: string) {
    super(message);
    this.name = 'RequeteInvalide';
  }
}

/** Ressource demandée inexistante : session, budget… */
export class Introuvable extends ErreurHttp {
  readonly statut: number = 404;

  constructor(message: string) {
    super(message);
    this.name = 'Introuvable';
  }
}

/** Vrai si l'erreur porte un statut connu ; sinon c'est un imprévu, donc un 500. */
export function estErreurConnue(erreur: unknown): erreur is ErreurHttp {
  return erreur instanceof ErreurHttp;
}
