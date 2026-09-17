/**
 * Recopie du contrat d'API (§4.1 du plan). La source de vérité est
 * `backend/src/types.ts` : ce fichier doit rester identique, champ pour champ.
 * Pas d'import croisé entre les deux workspaces — on recopie à la main.
 * Aucun tarif, aucun calcul de coût ici : les montants arrivent déjà calculés.
 */

/** Identifiants de modèle tels que Claude Code les écrit dans ses transcripts. */
export type ModeleId = 'claude-opus-5' | 'claude-sonnet-5' | 'claude-haiku-4-5';

/** Les quatre compteurs de tokens facturés par l'API, pour un appel. */
export interface Usage {
  readonly entree: number;
  readonly sortie: number;
  readonly cacheEcriture: number;
  readonly cacheLecture: number;
}

/** Tarif public d'un modèle, en dollars par million de tokens. */
export interface Tarif {
  readonly libelle: string;
  readonly entree: number;
  readonly sortie: number;
  readonly cacheEcriture: number;
  readonly cacheLecture: number;
}

/** Un tour = un appel au modèle dans une session Claude Code. */
export interface Tour {
  readonly index: number;
  readonly horodatage: string;
  readonly modele: ModeleId;
  readonly agent: string;
  readonly outil: string;
  readonly libelle: string;
  readonly usage: Usage;
}

/** Cycle de facturation courant ; `debut` et `fin` sont inclusifs. */
export interface Cycle {
  readonly debut: string; // 'YYYY-MM-DD'
  readonly fin: string;
  readonly jour: number; // jour écoulé dans le cycle, 1-based
  readonly jours: number; // durée du cycle en jours
}

/**
 * Un budget mensuel. `min`, `max` et `pas` bornent le curseur de plafond :
 * un plafond hors de ces bornes est refusé par l'API.
 */
export interface Budget {
  readonly id: string;
  readonly nom: string;
  readonly portee: string;
  readonly plafond: number;
  readonly seuils: readonly number[];
  readonly canaux: readonly string[];
  readonly min: number;
  readonly max: number;
  readonly pas: number;
  readonly modifieLe: string; // ISO
  readonly modifiePar: string;
}

export type EtatBudget = 'dans-le-budget' | 'a-surveiller' | 'limite-atteinte' | 'depassement-prevu';

/** Diagnostic de démarrage : dit laquelle des deux sources de données est active. */
export interface Sante {
  readonly statut: 'ok';
  readonly version: string;
  readonly source: 'exemple' | 'transcripts';
  readonly synchro: string; // ISO
  readonly cycle: Cycle;
}

export interface PointJournalier {
  readonly date: string;
  readonly cout: number;
  readonly parModele: Readonly<Record<ModeleId, number>>;
}

export interface LigneModele {
  readonly modele: ModeleId;
  readonly libelle: string;
  readonly cout: number;
  readonly tokens: number;
  readonly usage: Usage;
  readonly partCache: number;
}

/** Un poste de dépense d'un projet (outil, agent…). */
export interface Poste {
  readonly label: string;
  readonly cout: number;
}

/**
 * Une ligne de projet. `modeleDominant` porte la couleur de la ligne : la couleur
 * n'est pas un décor mais l'information « quel modèle coûte le plus ici ».
 * `alerte` est une phrase en français, jamais vide.
 */
export interface LigneProjet {
  readonly projet: string;
  readonly cout: number;
  readonly tokens: number;
  readonly sessions: number;
  readonly parModele: Readonly<Record<ModeleId, number>>;
  readonly part: number; // % du coût de la période
  readonly modeleDominant: ModeleId;
  readonly postes: readonly Poste[]; // les 3 postes les plus chers
  readonly alerte: string;
}

export interface LigneAgent {
  readonly agent: string;
  readonly cout: number;
  readonly appels: number;
  readonly parModele: Readonly<Record<ModeleId, number>>;
  /** Économie si les tours Opus de cet agent tournaient en Sonnet 5. */
  readonly economieSiSonnet: number;
}

export interface LigneOutil {
  readonly outil: string;
  readonly cout: number;
  readonly appels: number;
}

/**
 * Résumé d'une période. `deltaPeriodePrecedente` se compare à une période de même
 * durée ; `partPlafond` est la projection rapportée au plafond d'organisation.
 */
export interface Resume {
  readonly debut: string;
  readonly fin: string;
  readonly cout: number;
  readonly tokens: number;
  readonly sessions: number;
  readonly partCache: number;
  readonly economieCache: number;
  readonly projectionFinDeMois: number;
  readonly parJour: readonly PointJournalier[];
  readonly parModele: readonly LigneModele[];
  readonly deltaPeriodePrecedente: number; // % signé vs période précédente de même durée
  readonly plafondGlobal: number;
  readonly partPlafond: number; // projection / plafondGlobal, en %
}

export interface ResumeSession {
  readonly id: string;
  readonly projet: string;
  readonly branche: string;
  readonly debut: string;
  readonly fin: string;
  readonly tours: number;
  readonly cout: number;
  readonly tokens: number;
  readonly partCache: number;
}

export interface DetailTour extends Tour {
  readonly cout: number;
  readonly coutCumule: number;
}

export interface DetailSession extends ResumeSession {
  readonly detailTours: readonly DetailTour[];
  readonly parAgent: readonly LigneAgent[];
  readonly parOutil: readonly LigneOutil[];
}

export type SeveriteAlerte = 'critique' | 'limite' | 'info' | 'reglage';

/** Une alerte de budget. La sévérité est toujours doublée d'un libellé à l'écran. */
export interface Alerte {
  readonly id: string;
  readonly horodatage: string; // ISO
  readonly budgetId: string;
  readonly severite: SeveriteAlerte;
  readonly texte: string;
}

/** Canal de notification d'un budget (courriel, Slack, blocage dur). */
export interface Canal {
  readonly id: 'mail' | 'slack' | 'blocage';
  readonly libelle: string;
  readonly detail: string;
  readonly actif: boolean;
}

/**
 * L'état calculé d'un budget. `pctConsomme` et `pctProjection` sont bornés à 100
 * pour la jauge ; `verdict` est la phrase affichée dans le panneau de droite.
 */
export interface EtatDuBudget extends Omit<Budget, 'canaux'> {
  readonly consomme: number;
  readonly projection: number;
  readonly reste: number;
  readonly etat: EtatBudget;
  readonly seuilsFranchis: readonly number[];
  readonly pctConsomme: number;
  readonly pctProjection: number;
  readonly verdict: string;
  readonly canaux: readonly Canal[];
}

export interface ReponseBudgets {
  readonly budgets: readonly EtatDuBudget[];
  readonly alertes: readonly Alerte[];
}

/** Réglages en lecture seule. `chemin` est un chemin affichable, jamais un chemin absolu. */
export interface Reglages {
  readonly source: 'exemple' | 'transcripts';
  readonly chemin: string;
  readonly cycle: Cycle;
  readonly devise: 'USD';
  readonly modeles: readonly { modele: ModeleId; libelle: string; tarif: Tarif }[];
}
