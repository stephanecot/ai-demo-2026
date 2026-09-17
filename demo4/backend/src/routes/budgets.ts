import { Router } from 'express';
import { metAJourBudget, obtientBudgets, type ModificationsBudgetEntrantes } from '../services/budgets.js';
import { RequeteInvalide } from '../erreurs.js';
import { paramRoute } from './aide.js';

export const routeurBudgets = Router();

routeurBudgets.get('/budgets', async (_req, res) => {
  res.json(await obtientBudgets());
});

/**
 * Ne valide que la *forme* du corps (types) : les bornes métier (plafond vs
 * min/max/pas, seuils dans [1..100], canaux connus) sont vérifiées par
 * `services/budgets.ts`, qui seul connaît le budget visé.
 */
function valideCorpsPatch(corps: unknown): ModificationsBudgetEntrantes {
  if (typeof corps !== 'object' || corps === null) {
    throw new RequeteInvalide('Le corps de la requête doit être un objet JSON.');
  }
  const c = corps as Record<string, unknown>;
  const modifications: {
    plafond?: number;
    seuils?: readonly number[];
    canaux?: readonly string[];
  } = {};

  if ('plafond' in c) {
    const plafond = c['plafond'];
    if (typeof plafond !== 'number' || !Number.isFinite(plafond)) {
      throw new RequeteInvalide('Le champ « plafond » doit être un nombre.');
    }
    modifications.plafond = plafond;
  }
  if ('seuils' in c) {
    const seuils = c['seuils'];
    if (!Array.isArray(seuils) || !seuils.every((s): s is number => typeof s === 'number')) {
      throw new RequeteInvalide('Le champ « seuils » doit être un tableau de nombres.');
    }
    modifications.seuils = seuils;
  }
  if ('canaux' in c) {
    const canaux = c['canaux'];
    if (!Array.isArray(canaux) || !canaux.every((s): s is string => typeof s === 'string')) {
      throw new RequeteInvalide('Le champ « canaux » doit être un tableau de chaînes.');
    }
    modifications.canaux = canaux;
  }
  return modifications;
}

routeurBudgets.patch('/budgets/:id', async (req, res) => {
  const id = paramRoute(req.params['id'], 'id');
  const modifications = valideCorpsPatch(req.body);
  res.json(await metAJourBudget(id, modifications));
});
