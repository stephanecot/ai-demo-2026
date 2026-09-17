/**
 * Tous les textes de l'interface du Tokenomètre, en français.
 *
 * Groupés par écran (§5 du plan : `ecrans/TableauDeBord`, `Sessions`, `Session`,
 * `Budgets`, `ModelesEtAgents`, `Reglages`), plus une section `commun` pour ce
 * qui traverse tous les écrans (navigation, pied de page, états génériques).
 * Aucun composant ne doit contenir un texte en dur : tout vient d'ici.
 */

/** Les cinq destinations de navigation, dans l'ordre imposé par le plan. */
export const NAVIGATION = {
  tableauDeBord: 'Tableau de bord',
  sessions: 'Sessions',
  budgets: 'Budgets & alertes',
  modelesEtAgents: 'Modèles & agents',
  reglages: 'Réglages',
} as const;

/** Libellés des quatre états d'un budget (§6 du plan — jamais la couleur seule). */
export const ETATS_BUDGET = {
  'dans-le-budget': 'dans le budget',
  'a-surveiller': 'à surveiller',
  'limite-atteinte': 'limite atteinte',
  'depassement-prevu': 'dépassement prévu',
} as const;

/** Libellés des sévérités d'alerte. */
export const SEVERITES_ALERTE = {
  critique: 'critique',
  limite: 'limite atteinte',
  info: 'information',
  reglage: 'réglage',
} as const;

/** Libellés des trois modèles, pour les légendes de graphique et les puces. */
export const MODELES = {
  'claude-opus-5': 'Opus 5',
  'claude-sonnet-5': 'Sonnet 5',
  'claude-haiku-4-5': 'Haiku 4.5',
} as const;

/** Libellés des trois canaux de notification d'un budget. */
export const CANAUX = {
  mail: 'E-mail',
  slack: 'Slack',
  blocage: 'Blocage dur',
} as const;

/** Ce qui traverse tous les écrans : logo, navigation, pied de page, états génériques. */
export const COMMUN = {
  nomProduit: 'Tokenomètre',
  accroche: 'claude code · coûts',
  navigation: NAVIGATION,

  /** Bloc de bas de barre latérale, alimenté par `useSante()`. */
  barreLaterale: {
    source: 'source',
    cycleEnCours: 'cycle en cours',
    synchroPrefixe: 'synchro il y a',
    synchroSuffixe: 'min',
    synchroInconnue: 'synchro inconnue',
    jourDe: (jour: number, jours: number) => `jour ${jour} sur ${jours}`,
  },

  /** Mentions de pied de page (`PiedDePage`), reprises telles quelles des maquettes. */
  piedDePage: {
    mentionTarifs:
      'Tarifs API Anthropic en USD par million de tokens · coûts recalculés depuis les tokens facturés',
    sourceExemple: "données d'exemple",
    sourceTranscripts: 'transcripts réels',
  },

  /** Les quatre états obligatoires d'un hook de ressource. */
  etats: {
    chargement: 'Chargement…',
    erreurTitre: 'Une erreur est survenue',
    reessayer: 'Réessayer',
  },

  actions: {
    exporterCsv: 'Exporter CSV',
    exporter: 'Exporter',
    ouvrirTranscript: 'Ouvrir le transcript',
    annuler: 'Annuler',
    enregistrer: 'Enregistrer',
    nouveauBudget: 'Nouveau budget',
  },

  unites: {
    cout: '$',
    tokens: 'M tk',
  },
} as const;

/** Écran « Tableau de bord » (`ecrans/TableauDeBord`). */
export const TABLEAU_DE_BORD = {
  titre: 'Tableau de bord',
  segmentPeriodes: {
    '7j': '7 j',
    '10j': 'du mois',
    '30j': '30 j',
    trimestre: 'du trimestre',
  },
  segmentUnites: {
    cout: 'Coût',
    tokens: 'Tokens',
  },
  tuiles: {
    coutPeriode: (periodeCourt: string) => `Coût ${periodeCourt}`,
    vsPeriodePrecedente: 'vs période précédente',
    projectionFinDeMois: 'Projection fin de mois',
    partPlafond: (part: string) => `${part} du plafond`,
    tokensTraites: 'Tokens traités',
    partCache: 'Part servie par le cache',
    evites: 'évités',
  },
  graphique: {
    titreCout: 'Coût quotidien par modèle ($)',
    titreTokens: 'Tokens quotidiens par modèle (millions)',
    aide: 'Cliquez une barre pour isoler la journée',
  },
  projets: {
    titre: 'Projets',
    actifs: (n: number) => `${n} actifs`,
    colonneProjet: 'Projet',
    colonneCout: 'Coût $',
    colonneTokens: 'Tokens',
    colonnePart: 'Part',
    videTitre: 'Aucun projet sur cette période',
    videDetail: 'Change la période ou vérifie la source de données dans Réglages.',
  },
  detailProjet: {
    titre: 'Projet sélectionné',
    coutLabel: 'Coût',
    sessionsLabel: 'Sessions',
    repartitionModele: 'Répartition par modèle',
    postesLesPlusChers: 'Postes les plus chers',
  },
  videTitre: 'Rien à signaler sur cette période',
  videDetail: 'Aucune session enregistrée : le tableau de bord se remplira dès la première session facturée.',
} as const;

/** Écran « Sessions » — liste, pas de maquette dédiée mais mêmes composants. */
export const SESSIONS = {
  titre: 'Sessions',
  colonneSession: 'Session',
  colonneProjet: 'Projet',
  colonneDebut: 'Début',
  colonneDuree: 'Durée',
  colonneTours: 'Tours',
  colonneCout: 'Coût $',
  filtreProjetLabel: 'Projet',
  filtreProjetTous: 'Tous les projets',
  videTitre: 'Aucune session sur cette période',
  videDetail: 'Élargis la période ou change de projet pour retrouver des sessions.',
} as const;

/** Écran « Détail d'une session » (`ecrans/Session`). */
export const SESSION = {
  microLabel: 'Session',
  chipTerminee: 'terminée',
  onglets: {
    tours: 'Par tour',
    agents: 'Par agent',
    outils: 'Par outil',
  },
  tuiles: {
    coutSession: 'Coût de la session',
    tours: 'Tours',
    tokens: 'Tokens',
    cache: 'Cache',
    coutMoyenParTour: 'Coût moyen / tour',
  },
  graphique: {
    titre: 'Coût cumulé au fil des tours',
    tourSelectionne: (n: number, cumule: string) => `tour ${n} sélectionné · ${cumule} $ cumulés`,
  },
  tableauTours: {
    numero: '#',
    agent: 'Agent',
    outil: 'Outil',
    modele: 'Modèle',
    action: 'Action',
    tokens: 'Tokens (e / s / cache)',
    cout: 'Coût $',
  },
  videTitre: 'Aucun tour dans cette session',
  videDetail: 'La session ne contient encore aucun appel facturé.',
} as const;

/** Écran « Budgets & alertes » (`ecrans/Budgets`). */
export const BUDGETS = {
  titre: 'Budgets & alertes',
  sousTitre: (n: number, depassements: number) =>
    depassements > 0
      ? `${n} budgets · ${depassements} dépassement${depassements > 1 ? 's' : ''} prévu${depassements > 1 ? 's' : ''}`
      : `${n} budgets`,
  consommesEtProjection: (conso: string, proj: string) => `${conso} $ consommés · projection ${proj} $`,
  plafondLabel: (plafond: string) => `plafond ${plafond} $`,
  alertesRecentes: 'Alertes récentes',
  reglageBudget: {
    titre: 'Réglage du budget',
    plafondMensuel: 'Plafond mensuel',
    curseurAriaLabel: 'Plafond mensuel du budget',
    diminuer: 'Diminuer le plafond',
    augmenter: 'Augmenter le plafond',
    consomme: 'Consommé',
    projection: 'Projection',
    reste: 'Reste',
    alerterA: 'Alerter à',
    canaux: 'Canaux',
    modifieLe: (delaiTexte: string, auteur: string) => `modifié ${delaiTexte} par ${auteur}`,
  },
  mentionProjection:
    "Projection = rythme des 10 premiers jours extrapolé sur le cycle · données d'exemple",
  videTitre: 'Aucun budget configuré',
  videDetail: 'Crée un budget pour commencer à surveiller un plafond de dépense.',
} as const;

/** Écran « Modèles & agents » (`ecrans/ModelesEtAgents`) — sans maquette dédiée. */
export const MODELES_ET_AGENTS = {
  titre: 'Modèles & agents',
  sectionModeles: 'Par modèle',
  sectionAgents: 'Par agent',
  sectionOutils: 'Par outil',
  colonneModele: 'Modèle',
  colonneAgent: 'Agent',
  colonneOutil: 'Outil',
  colonneCout: 'Coût $',
  colonneTokens: 'Tokens',
  colonneAppels: 'Appels',
  colonnePartCache: 'Part cache',
  economieSiSonnet: (montantTexte: string) => `Économie si Sonnet 5 : ${montantTexte} $`,
  mentionRecalcul: 'Les coûts sont recalculés depuis les tokens facturés, pas relevés sur une facture.',
  videTitre: 'Aucune activité de modèle ou d’agent sur cette période',
  videDetail: 'Choisis une autre période pour retrouver de l’activité.',
} as const;

/** Écran « Réglages » (`ecrans/Reglages`) — sans maquette dédiée. */
export const REGLAGES = {
  titre: 'Réglages',
  sectionSource: 'Source des données',
  sourceExempleLabel: "Jeu d'exemple",
  sourceTranscriptsLabel: 'Transcripts réels',
  cheminLabel: 'Dossier lu',
  sectionCycle: 'Cycle de facturation',
  sectionTarifs: 'Tarifs par modèle',
  colonneModele: 'Modèle',
  colonneEntree: 'Entrée',
  colonneSortie: 'Sortie',
  colonneCacheEcriture: 'Écriture cache',
  colonneCacheLecture: 'Lecture cache',
  uniteTarif: '$ / M tokens',
  videTitre: 'Réglages indisponibles',
  videDetail: 'Aucune information de réglage n’a pu être chargée pour le moment.',
} as const;

/** Messages d'erreur génériques quand le backend n'en fournit pas (cas réseau). */
export const ERREURS = {
  reseau: 'La connexion au serveur a échoué. Vérifie que le backend est démarré.',
  inattendue: 'Une erreur inattendue est survenue.',
} as const;
