import { describe, expect, it } from 'vitest';
import {
  arrondi,
  coutUsage,
  economieCache,
  MODELES,
  totalTokens,
  usageVide,
} from '../src/domain/tarifs.js';
import {
  coutSession,
  detailSession,
  parJour,
  parModele,
  parOutil,
  parProjet,
  partCache,
  resume,
} from '../src/domain/agregation.js';
import { sessionsExemple } from '../src/data/jeu-exemple.js';
import type { Session, Usage } from '../src/types.js';

const USAGE_NOMINAL: Usage = { entree: 1_000_000, sortie: 200_000, cacheEcriture: 50_000, cacheLecture: 800_000 };

describe('tarifs — coutUsage', () => {
  it('cas nominal : calcule un coût à partir des quatre compteurs, pour chaque modèle', () => {
    // Opus 5 : 1 $/M entrée à 5 $, 0,2 $/M sortie à 25 $, etc. — calcul à la main.
    const cout = coutUsage(USAGE_NOMINAL, 'claude-opus-5');
    const attendu = (1_000_000 * 5 + 200_000 * 25 + 50_000 * 6.25 + 800_000 * 0.5) / 1_000_000;
    expect(cout).toBeCloseTo(attendu, 3);
  });

  it('cas limite : un usage à zéro coûte 0 $', () => {
    expect(coutUsage(usageVide(), 'claude-sonnet-5')).toBe(0);
  });

  it("cas d'erreur : un modèle inconnu lève une exception plutôt que de coûter 0 en silence", () => {
    expect(() => coutUsage(USAGE_NOMINAL, 'gpt-4' as unknown as 'claude-opus-5')).toThrow();
  });
});

describe('tarifs — economieCache', () => {
  it('cas nominal : le cache économise strictement moins cher que du plein tarif', () => {
    expect(economieCache(USAGE_NOMINAL, 'claude-opus-5')).toBeGreaterThan(0);
  });

  it('cas limite : sans lecture de cache, aucune économie', () => {
    const sansCache: Usage = { entree: 1000, sortie: 500, cacheEcriture: 0, cacheLecture: 0 };
    expect(economieCache(sansCache, 'claude-haiku-4-5')).toBe(0);
  });
});

describe('arrondi', () => {
  it('arrondit au millième de dollar', () => {
    expect(arrondi(1.23456)).toBe(1.235);
    expect(arrondi(0)).toBe(0);
  });
});

describe('agregation — cas limites transverses', () => {
  it('une session sans tour vaut 0 $ et ne fait planter aucune agrégation', () => {
    const vide: Session = { id: 's-vide', projet: 'x', branche: 'main', debut: '', fin: '', tours: [] };
    expect(coutSession(vide)).toBe(0);
    expect(partCache(usageVide())).toBe(0);
    expect(() => detailSession(vide)).not.toThrow();
    expect(() => parJour([vide])).not.toThrow();
    expect(() => resume([vide], { debut: '2026-09-01', fin: '2026-09-01', joursDuCycle: 1 })).not.toThrow();
  });

  it('un tableau de sessions vide produit des agrégations vides, jamais une exception', () => {
    expect(parJour([])).toEqual([]);
    expect(parModele([])).toEqual([]);
    expect(parProjet([])).toEqual([]);
    expect(parOutil([])).toEqual([]);
    const r = resume([], { debut: '2026-09-01', fin: '2026-09-10', joursDuCycle: 10 });
    expect(r.cout).toBe(0);
    expect(r.sessions).toBe(0);
    expect(r.partCache).toBe(0);
  });
});

describe('agregation — coutTour / coutSession', () => {
  it('cas nominal : le coût de la session de référence (4f2c9a1e) retombe sur celui de la maquette', () => {
    const reference = sessionsExemple.find((s) => s.id === '4f2c9a1e');
    expect(reference).toBeDefined();
    if (reference === undefined) return;
    expect(reference.tours).toHaveLength(14);
    expect(coutSession(reference)).toBeCloseTo(2.386, 2);
    const usageTotal = reference.tours.reduce(
      (acc, t) => ({
        entree: acc.entree + t.usage.entree,
        sortie: acc.sortie + t.usage.sortie,
        cacheEcriture: acc.cacheEcriture + t.usage.cacheEcriture,
        cacheLecture: acc.cacheLecture + t.usage.cacheLecture,
      }),
      usageVide(),
    );
    expect(partCache(usageTotal)).toBeCloseTo(83, 0);
  });
});

describe("l'invariant du produit : total période = somme des jours = somme des projets = somme des modèles", () => {
  const TOLERANCE = 0.05; // quelques centimes d'arrondi cumulé, voir le rapport de mission

  it('tient sur le jeu d’exemple complet (1 → 10 septembre 2026)', () => {
    const r = resume(sessionsExemple, { debut: '2026-09-01', fin: '2026-09-10', joursDuCycle: 10 });

    const sommeJours = arrondi(r.parJour.reduce((total, j) => total + j.cout, 0));
    const sommeProjets = arrondi(parProjet(sessionsExemple).reduce((total, p) => total + p.cout, 0));
    const sommeModeles = arrondi(parModele(sessionsExemple).reduce((total, m) => total + m.cout, 0));

    expect(Math.abs(r.cout - sommeJours)).toBeLessThanOrEqual(TOLERANCE);
    expect(Math.abs(r.cout - sommeProjets)).toBeLessThanOrEqual(TOLERANCE);
    expect(Math.abs(r.cout - sommeModeles)).toBeLessThanOrEqual(TOLERANCE);

    // Chiffres plausibles annoncés par la mission : ~314 $ sur la période.
    expect(r.cout).toBeGreaterThan(300);
    expect(r.cout).toBeLessThan(330);
  });

  it('la part de cache du jeu est dans la fourchette 40-95 % attendue du produit', () => {
    const r = resume(sessionsExemple, { debut: '2026-09-01', fin: '2026-09-10', joursDuCycle: 10 });
    expect(r.partCache).toBeGreaterThan(40);
    expect(r.partCache).toBeLessThan(95);
  });

  it('chaque modèle connu du jeu est bien un modèle tarifé de tarifs.ts', () => {
    for (const ligne of parModele(sessionsExemple)) {
      expect(MODELES).toContain(ligne.modele);
    }
  });

  it('les tokens totaux du résumé égalent la somme des tokens par modèle', () => {
    const r = resume(sessionsExemple, { debut: '2026-09-01', fin: '2026-09-10', joursDuCycle: 10 });
    const sommeTokens = parModele(sessionsExemple).reduce((total, m) => total + totalTokens(m.usage), 0);
    expect(r.tokens).toBe(sommeTokens);
  });
});
