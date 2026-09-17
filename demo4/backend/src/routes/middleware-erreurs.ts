import type { ErrorRequestHandler } from 'express';
import { estErreurConnue } from '../erreurs.js';

/**
 * Middleware d'erreur unique du produit : traduit les erreurs typées
 * (`erreurs.ts`) en `{ "erreur": "<message>" }` avec leur code HTTP. Toute
 * erreur imprévue tombe en 500, sans jamais renvoyer sa pile ni un chemin du
 * disque.
 */
export const middlewareErreurs: ErrorRequestHandler = (erreur, _req, res, _next) => {
  if (estErreurConnue(erreur)) {
    res.status(erreur.statut).json({ erreur: erreur.message });
    return;
  }
  res.status(500).json({ erreur: 'Une erreur interne est survenue.' });
};
