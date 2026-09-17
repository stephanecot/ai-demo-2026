import {
  additionne,
  arrondi,
  coutBrut,
  coutUsage,
  economieCacheBrute,
  MODELES,
  tarifDe,
  totalTokens,
  usageVide,
} from './tarifs.js';
import type {
  DetailSession,
  DetailTour,
  LigneAgent,
  LigneModele,
  LigneProjet,
  ModeleId,
  PointJournalier,
  Poste,
  Resume,
  ResumeSession,
  Session,
  Tour,
  Usage,
} from '../types.js';

/**
 * Toutes les agrégations sont pures : mêmes sessions en entrée, mêmes chiffres
 * en sortie.
 *
 * Règle de calcul (plan §3) : on cumule des coûts **bruts** (`coutBrut`) et on
 * n'appelle `arrondi` qu'en écrivant un champ de réponse. Arrondir chaque tour
 * avant de l'additionner faisait dériver les totaux de quelques millièmes : la
 * somme des modèles ne retombait plus sur le total de la période, alors que le
 * plan en fait un invariant.
 */

export function jourDe(horodatage: string): string {
  return horodatage.slice(0, 10);
}

function zeroParModele(): Record<ModeleId, number> {
  return { 'claude-opus-5': 0, 'claude-sonnet-5': 0, 'claude-haiku-4-5': 0 };
}

/** Passe une ventilation par modèle du cumul brut à la valeur publiée. */
function arrondiParModele(brut: Record<ModeleId, number>): Record<ModeleId, number> {
  return {
    'claude-opus-5': arrondi(brut['claude-opus-5']),
    'claude-sonnet-5': arrondi(brut['claude-sonnet-5']),
    'claude-haiku-4-5': arrondi(brut['claude-haiku-4-5']),
  };
}

/** Coût non arrondi d'un tour : la brique de toutes les additions internes. */
export function coutTourBrut(tour: Tour): number {
  return coutBrut(tour.usage, tour.modele);
}

/** Coût d'un tour tel qu'il est publié dans une réponse (arrondi au millième). */
export function coutTour(tour: Tour): number {
  return coutUsage(tour.usage, tour.modele);
}

export function coutSession(session: Session): number {
  return arrondi(session.tours.reduce((total, tour) => total + coutTourBrut(tour), 0));
}

export function usageSession(session: Session): Usage {
  return session.tours.reduce<Usage>((acc, tour) => additionne(acc, tour.usage), usageVide());
}

export function partCache(usage: Usage): number {
  const total = totalTokens(usage);
  return total === 0 ? 0 : arrondi((usage.cacheLecture / total) * 100);
}

export function toursDe(sessions: readonly Session[]): Tour[] {
  return sessions.flatMap((session) => [...session.tours]);
}

export function parJour(sessions: readonly Session[]): PointJournalier[] {
  const parDate = new Map<string, Record<ModeleId, number>>();
  for (const tour of toursDe(sessions)) {
    const date = jourDe(tour.horodatage);
    const ligne = parDate.get(date) ?? zeroParModele();
    ligne[tour.modele] += coutTourBrut(tour);
    parDate.set(date, ligne);
  }
  return [...parDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, brut]) => ({
      date,
      cout: arrondi(MODELES.reduce((total, m) => total + brut[m], 0)),
      parModele: arrondiParModele(brut),
    }));
}

export function parModele(sessions: readonly Session[]): LigneModele[] {
  const usages = new Map<ModeleId, Usage>();
  for (const tour of toursDe(sessions)) {
    usages.set(tour.modele, additionne(usages.get(tour.modele) ?? usageVide(), tour.usage));
  }
  return MODELES.filter((modele) => usages.has(modele)).map((modele) => {
    const usage = usages.get(modele) ?? usageVide();
    return {
      modele,
      libelle: tarifDe(modele).libelle,
      cout: coutUsage(usage, modele),
      tokens: totalTokens(usage),
      usage,
      partCache: partCache(usage),
    };
  });
}

export function parProjet(sessions: readonly Session[]): LigneProjet[] {
  const parNom = new Map<
    string,
    { cout: number; tokens: number; sessions: number; parModele: Record<ModeleId, number>; tours: Tour[] }
  >();
  for (const session of sessions) {
    const ligne = parNom.get(session.projet) ?? {
      cout: 0,
      tokens: 0,
      sessions: 0,
      parModele: zeroParModele(),
      tours: [],
    };
    ligne.sessions += 1;
    for (const tour of session.tours) {
      const cout = coutTourBrut(tour);
      ligne.cout += cout;
      ligne.tokens += totalTokens(tour.usage);
      ligne.parModele[tour.modele] += cout;
      ligne.tours.push(tour);
    }
    parNom.set(session.projet, ligne);
  }
  const total = [...parNom.values()].reduce((acc, ligne) => acc + ligne.cout, 0);
  const premierModele = MODELES[0] ?? 'claude-opus-5';
  return [...parNom.entries()]
    .map(([projet, ligne]) => {
      const modeleDominant = MODELES.reduce<ModeleId>(
        (meilleur, m) => (ligne.parModele[m] > ligne.parModele[meilleur] ? m : meilleur),
        premierModele,
      );
      const postes: Poste[] = parOutil(ligne.tours)
        .slice(0, 3)
        .map((p) => ({ label: p.outil, cout: p.cout }));
      const part = total === 0 ? 0 : arrondi((ligne.cout / total) * 100);
      return {
        projet,
        cout: arrondi(ligne.cout),
        tokens: ligne.tokens,
        sessions: ligne.sessions,
        parModele: arrondiParModele(ligne.parModele),
        part,
        modeleDominant,
        postes,
        // Alerte générique et toujours non vide : un service conscient des
        // budgets (domain/budgets.ts + le budget de portée « projet ») peut
        // la remplacer par un texte plus riche sans changer ce contrat.
        // Elle ne cite qu'un pourcentage entier : le backend ne met jamais en
        // forme un montant (séparateur décimal, espace fine) — c'est le rôle de
        // `frontend/src/format.ts`.
        alerte:
          `${projet} pèse ${Math.round(part)} % du coût de la période sur ` +
          `${ligne.sessions} session${ligne.sessions > 1 ? 's' : ''}, ` +
          `dominé par ${tarifDe(modeleDominant).libelle}.`,
      };
    })
    .sort((a, b) => b.cout - a.cout);
}

export function parAgent(tours: readonly Tour[]): LigneAgent[] {
  const parNom = new Map<string, { cout: number; appels: number; parModele: Record<ModeleId, number>; economieSiSonnet: number }>();
  for (const tour of tours) {
    const ligne = parNom.get(tour.agent) ?? { cout: 0, appels: 0, parModele: zeroParModele(), economieSiSonnet: 0 };
    const cout = coutTourBrut(tour);
    ligne.cout += cout;
    ligne.appels += 1;
    ligne.parModele[tour.modele] += cout;
    if (tour.modele === 'claude-opus-5') {
      ligne.economieSiSonnet += cout - coutBrut(tour.usage, 'claude-sonnet-5');
    }
    parNom.set(tour.agent, ligne);
  }
  return [...parNom.entries()]
    .map(([agent, ligne]) => ({
      agent,
      cout: arrondi(ligne.cout),
      appels: ligne.appels,
      parModele: arrondiParModele(ligne.parModele),
      economieSiSonnet: arrondi(ligne.economieSiSonnet),
    }))
    .sort((a, b) => b.cout - a.cout);
}

export function parOutil(tours: readonly Tour[]): { outil: string; cout: number; appels: number }[] {
  const parNom = new Map<string, { cout: number; appels: number }>();
  for (const tour of tours) {
    const ligne = parNom.get(tour.outil) ?? { cout: 0, appels: 0 };
    ligne.cout += coutTourBrut(tour);
    ligne.appels += 1;
    parNom.set(tour.outil, ligne);
  }
  return [...parNom.entries()]
    .map(([outil, ligne]) => ({ outil, cout: arrondi(ligne.cout), appels: ligne.appels }))
    .sort((a, b) => b.cout - a.cout);
}

/** Extrapolation linéaire du rythme observé sur la durée du cycle. */
export function projection(cout: number, joursEcoules: number, joursDuCycle: number): number {
  if (joursEcoules <= 0) return 0;
  return arrondi((cout / joursEcoules) * joursDuCycle);
}

export function resumeSession(session: Session): ResumeSession {
  const usage = usageSession(session);
  return {
    id: session.id,
    projet: session.projet,
    branche: session.branche,
    debut: session.debut,
    fin: session.fin,
    tours: session.tours.length,
    cout: coutSession(session),
    tokens: totalTokens(usage),
    partCache: partCache(usage),
  };
}

export function detailSession(session: Session): DetailSession {
  let cumule = 0;
  const detailTours: DetailTour[] = session.tours.map((tour) => {
    cumule += coutTourBrut(tour);
    return { ...tour, cout: coutTour(tour), coutCumule: arrondi(cumule) };
  });
  return {
    ...resumeSession(session),
    detailTours,
    parAgent: parAgent(session.tours),
    parOutil: parOutil(session.tours),
  };
}

export function resume(
  sessions: readonly Session[],
  bornes: {
    debut: string;
    fin: string;
    joursDuCycle: number;
    /** Coût de la période précédente de même durée ; absent ou 0 ⇒ delta à 0. */
    coutPeriodePrecedente?: number;
    /** Plafond de l'organisation ; absent ou 0 ⇒ partPlafond à 0. */
    plafondGlobal?: number;
  },
): Resume {
  const points = parJour(sessions);
  const usage = toursDe(sessions).reduce<Usage>((acc, tour) => additionne(acc, tour.usage), usageVide());
  const cout = arrondi(toursDe(sessions).reduce((total, tour) => total + coutTourBrut(tour), 0));
  const economie = arrondi(
    toursDe(sessions).reduce((total, tour) => total + economieCacheBrute(tour.usage, tour.modele), 0),
  );
  const projectionFinDeMois = projection(cout, points.length, bornes.joursDuCycle);
  const coutPrecedent = bornes.coutPeriodePrecedente ?? 0;
  const deltaPeriodePrecedente =
    coutPrecedent === 0 ? 0 : arrondi(((cout - coutPrecedent) / coutPrecedent) * 100);
  const plafondGlobal = bornes.plafondGlobal ?? 0;
  const partPlafond = plafondGlobal === 0 ? 0 : arrondi((projectionFinDeMois / plafondGlobal) * 100);
  return {
    debut: bornes.debut,
    fin: bornes.fin,
    cout,
    tokens: totalTokens(usage),
    sessions: sessions.length,
    partCache: partCache(usage),
    economieCache: economie,
    projectionFinDeMois,
    parJour: points,
    deltaPeriodePrecedente,
    plafondGlobal,
    partPlafond,
    parModele: parModele(sessions),
  };
}
