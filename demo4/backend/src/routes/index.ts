import { Router } from 'express';
import { Introuvable } from '../erreurs.js';
import { routeurAgents } from './agents.js';
import { routeurBudgets } from './budgets.js';
import { routeurExport } from './export.js';
import { routeurProjets } from './projets.js';
import { routeurReglages } from './reglages.js';
import { routeurResume } from './resume.js';
import { routeurSante } from './sante.js';
import { routeurSessions } from './sessions.js';

/** Les dix routes du contrat (§4.2 du plan), montées sous `/api`. */
export const routeurApi = Router();

routeurApi.use(routeurSante);
routeurApi.use(routeurResume);
routeurApi.use(routeurProjets);
routeurApi.use(routeurSessions);
routeurApi.use(routeurAgents);
routeurApi.use(routeurBudgets);
routeurApi.use(routeurReglages);
routeurApi.use(routeurExport);

// Filet de sécurité : toute route sous `/api` qui ne correspond à aucune des
// dix ci-dessus est une ressource inconnue, pas une erreur serveur.
routeurApi.use((_req, _res, next) => {
  next(new Introuvable('La ressource demandée est introuvable.'));
});
