import { arrondi } from '../domain/tarifs.js';
import { coutTourBrut, projection, toursDe } from '../domain/agregation.js';
import {
  etatBudget,
  pctConsomme,
  pctProjection,
  resteBudget,
  seuilsFranchis,
  verdictBudget,
} from '../domain/budgets.js';
import {
  alertes as alertesDuDepot,
  budgets as budgetsDuDepot,
  metAJourBudget as metAJourBudgetDuDepot,
  sessions as sessionsDuDepot,
} from './depot.js';
import { cycleEnCours } from './periodes.js';
import { sessionsDansLaPeriode } from './filtre.js';
import { Introuvable, RequeteInvalide } from '../erreurs.js';
import type { Budget, Canal, Cycle, EtatDuBudget, ReponseBudgets, Session } from '../types.js';

/**
 * Les trois canaux de notification connus du produit. Repris à la lettre de
 * `design/Budgets.dc.html` (`{ key, label, detail }`) : ce n'est pas un tarif,
 * juste le texte d'affichage d'un canal.
 */
const CANAUX_CONNUS: readonly Omit<Canal, 'actif'>[] = [
  { id: 'mail', libelle: 'E-mail', detail: 'avv-leads@exemple.fr' },
  { id: 'slack', libelle: 'Slack', detail: '#claude-code-couts' },
  { id: 'blocage', libelle: 'Blocage dur à 100 %', detail: 'refuse les nouvelles sessions du projet' },
];

const IDS_CANAUX_CONNUS: readonly string[] = CANAUX_CONNUS.map((c) => c.id);

function canauxDe(actifs: readonly string[]): Canal[] {
  return CANAUX_CONNUS.map((c) => ({ ...c, actif: actifs.includes(c.id) }));
}

/**
 * Coût de toutes les sessions données, arrondi une seule fois à la sortie.
 * On cumule des coûts bruts pour que le consommé d'un budget retombe exactement
 * sur le coût que `/api/resume` et `/api/projets` annoncent pour le même
 * périmètre — sinon un budget « projet » affiche 54,803 $ là où le tableau de
 * bord affiche 54,8 $.
 */
function coutDesSessions(sessions: readonly Session[]): number {
  return arrondi(toursDe(sessions).reduce((total, tour) => total + coutTourBrut(tour), 0));
}

/**
 * Sessions qui comptent pour ce budget : toutes pour une portée
 * « organisation », seulement celles du projet homonyme sinon — convention du
 * jeu d'exemple documentée dans `data/jeu-exemple.ts`.
 */
function sessionsDuScope(toutes: readonly Session[], budget: Budget): readonly Session[] {
  if (budget.portee.startsWith('organisation')) return toutes;
  return toutes.filter((s) => s.projet === budget.id);
}

function construitEtat(budget: Budget, toutes: readonly Session[], cycle: Cycle): EtatDuBudget {
  const { canaux, ...reste } = budget;
  const scope = sessionsDansLaPeriode(sessionsDuScope(toutes, budget), cycle.debut, cycle.fin);
  const consomme = coutDesSessions(scope);
  const proj = projection(consomme, cycle.jour, cycle.jours);
  return {
    ...reste,
    consomme,
    projection: proj,
    reste: resteBudget(budget.plafond, consomme),
    etat: etatBudget(proj, budget.plafond),
    seuilsFranchis: seuilsFranchis(budget.seuils, proj, budget.plafond),
    pctConsomme: pctConsomme(consomme, budget.plafond),
    pctProjection: pctProjection(proj, budget.plafond),
    verdict: verdictBudget({ plafond: budget.plafond, consomme, projection: proj }),
    canaux: canauxDe(canaux),
  };
}

export async function obtientBudgets(): Promise<ReponseBudgets> {
  const [toutes, budgetsBruts, alertesBrutes] = await Promise.all([
    sessionsDuDepot(),
    budgetsDuDepot(),
    alertesDuDepot(),
  ]);
  const cycle = cycleEnCours();
  return {
    budgets: budgetsBruts.map((b) => construitEtat(b, toutes, cycle)),
    alertes: alertesBrutes,
  };
}

export interface ModificationsBudgetEntrantes {
  readonly plafond?: number;
  readonly seuils?: readonly number[];
  readonly canaux?: readonly string[];
}

function validePlafond(plafond: number, budget: Budget): void {
  if (plafond < budget.min || plafond > budget.max) {
    throw new RequeteInvalide(`Le plafond doit être compris entre ${budget.min} et ${budget.max} pour ce budget.`);
  }
  const pas = (plafond - budget.min) / budget.pas;
  if (Math.abs(pas - Math.round(pas)) > 1e-6) {
    throw new RequeteInvalide(`Le plafond doit respecter un pas de ${budget.pas} à partir de ${budget.min}.`);
  }
}

function valideSeuils(seuils: readonly number[]): void {
  for (const seuil of seuils) {
    if (!Number.isFinite(seuil) || seuil < 1 || seuil > 100) {
      throw new RequeteInvalide('Chaque seuil doit être un nombre compris entre 1 et 100.');
    }
  }
}

function valideCanaux(canaux: readonly string[]): void {
  for (const id of canaux) {
    if (!IDS_CANAUX_CONNUS.includes(id)) {
      throw new RequeteInvalide(`Le canal « ${id} » est inconnu.`);
    }
  }
}

export async function metAJourBudget(
  id: string,
  modifications: ModificationsBudgetEntrantes,
): Promise<EtatDuBudget> {
  const budgetsBruts = await budgetsDuDepot();
  const existant = budgetsBruts.find((b) => b.id === id);
  if (existant === undefined) {
    throw new Introuvable(`Aucun budget ne correspond à l'identifiant « ${id} ».`);
  }
  if (modifications.plafond !== undefined) validePlafond(modifications.plafond, existant);
  if (modifications.seuils !== undefined) valideSeuils(modifications.seuils);
  if (modifications.canaux !== undefined) valideCanaux(modifications.canaux);

  const misAJour = await metAJourBudgetDuDepot(id, modifications);
  const toutes = await sessionsDuDepot();
  const cycle = cycleEnCours();
  return construitEtat(misAJour, toutes, cycle);
}
