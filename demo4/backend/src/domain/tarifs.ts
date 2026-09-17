import type { ModeleId, Tarif, Usage } from '../types.js';

/**
 * Tarifs publics de l'API Anthropic, en dollars par million de tokens.
 * Source unique de vérité pour tout calcul de coût : aucune autre valeur
 * monétaire ne doit apparaître ailleurs dans le code.
 */
export const TARIFS: Readonly<Record<ModeleId, Tarif>> = {
  'claude-opus-5': {
    libelle: 'Opus 5',
    entree: 5,
    sortie: 25,
    cacheEcriture: 6.25,
    cacheLecture: 0.5,
  },
  'claude-sonnet-5': {
    libelle: 'Sonnet 5',
    entree: 2,
    sortie: 10,
    cacheEcriture: 2.5,
    cacheLecture: 0.2,
  },
  'claude-haiku-4-5': {
    libelle: 'Haiku 4.5',
    entree: 1,
    sortie: 5,
    cacheEcriture: 1.25,
    cacheLecture: 0.1,
  },
};

export const MODELES = Object.keys(TARIFS) as ModeleId[];

const MILLION = 1_000_000;

/** Arrondi monétaire au millième de dollar : on additionne des fractions de cent. */
export function arrondi(dollars: number): number {
  return Math.round(dollars * 1000) / 1000;
}

export function tarifDe(modele: ModeleId): Tarif {
  const tarif = TARIFS[modele];
  if (!tarif) {
    throw new Error(`Modèle inconnu : ${modele}.`);
  }
  return tarif;
}

/**
 * Coût facturé d'un usage, cache compris, **non arrondi**.
 *
 * C'est la seule forme qu'on additionne : additionner des coûts déjà arrondis
 * au millième fait dériver les totaux (le plan, §3, l'interdit explicitement —
 * « on arrondit à la sortie, jamais à chaque addition »). Les agrégations
 * cumulent donc `coutBrut` et n'appellent `arrondi` qu'au moment de produire
 * un champ de réponse.
 */
export function coutBrut(usage: Usage, modele: ModeleId): number {
  const t = tarifDe(modele);
  const total =
    usage.entree * t.entree +
    usage.sortie * t.sortie +
    usage.cacheEcriture * t.cacheEcriture +
    usage.cacheLecture * t.cacheLecture;
  return total / MILLION;
}

/** Coût facturé d'un usage, cache compris, arrondi au millième de dollar. */
export function coutUsage(usage: Usage, modele: ModeleId): number {
  return arrondi(coutBrut(usage, modele));
}

/**
 * Coût qu'aurait eu le même usage sans cache : les tokens relus au tarif
 * cache auraient été facturés en entrée pleine. Sert à chiffrer ce que le
 * cache fait économiser — c'est la seule définition retenue dans le produit.
 */
export function coutSansCacheBrut(usage: Usage, modele: ModeleId): number {
  const t = tarifDe(modele);
  const total =
    (usage.entree + usage.cacheLecture + usage.cacheEcriture) * t.entree +
    usage.sortie * t.sortie;
  return total / MILLION;
}

export function coutSansCache(usage: Usage, modele: ModeleId): number {
  return arrondi(coutSansCacheBrut(usage, modele));
}

/** Économie brute, non arrondie : c'est elle qu'on cumule sur plusieurs tours. */
export function economieCacheBrute(usage: Usage, modele: ModeleId): number {
  return coutSansCacheBrut(usage, modele) - coutBrut(usage, modele);
}

export function economieCache(usage: Usage, modele: ModeleId): number {
  return arrondi(economieCacheBrute(usage, modele));
}

export function totalTokens(usage: Usage): number {
  return usage.entree + usage.sortie + usage.cacheEcriture + usage.cacheLecture;
}

export function usageVide(): Usage {
  return { entree: 0, sortie: 0, cacheEcriture: 0, cacheLecture: 0 };
}

export function additionne(a: Usage, b: Usage): Usage {
  return {
    entree: a.entree + b.entree,
    sortie: a.sortie + b.sortie,
    cacheEcriture: a.cacheEcriture + b.cacheEcriture,
    cacheLecture: a.cacheLecture + b.cacheLecture,
  };
}
