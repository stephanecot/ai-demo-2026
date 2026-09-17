import { describe, expect, it } from 'vitest';
import {
  etatBudget,
  pctConsomme,
  pctProjection,
  ratioProjection,
  resteBudget,
  seuilsFranchis,
  verdictBudget,
} from '../src/domain/budgets.js';

describe('etatBudget', () => {
  it('cas nominal : couvre les quatre états sur les bornes de la maquette', () => {
    expect(etatBudget(50, 100)).toBe('dans-le-budget'); // ratio 0,5
    expect(etatBudget(80, 100)).toBe('a-surveiller'); // ratio 0,8
    expect(etatBudget(100, 100)).toBe('limite-atteinte'); // ratio 1,0
    expect(etatBudget(120, 100)).toBe('depassement-prevu'); // ratio 1,2
  });

  it('cas limite : les seuils eux-mêmes basculent dans la tranche supérieure (comparaison stricte)', () => {
    expect(etatBudget(70, 100)).toBe('a-surveiller'); // ratio pile 0,7
    expect(etatBudget(95, 100)).toBe('limite-atteinte'); // ratio pile 0,95
    expect(etatBudget(110, 100)).toBe('depassement-prevu'); // ratio pile 1,1
  });

  it("cas erreur : un plafond nul ou négatif est traité comme un dépassement, sans diviser par zéro", () => {
    expect(etatBudget(10, 0)).toBe('depassement-prevu');
    expect(etatBudget(10, -5)).toBe('depassement-prevu');
    expect(() => etatBudget(10, 0)).not.toThrow();
  });
});

describe('ratioProjection', () => {
  it('cas nominal', () => {
    expect(ratioProjection(50, 100)).toBe(0.5);
  });

  it('cas limite : plafond nul ⇒ infini plutôt que NaN', () => {
    expect(ratioProjection(50, 0)).toBe(Number.POSITIVE_INFINITY);
  });
});

describe('seuilsFranchis', () => {
  it('cas nominal : ne renvoie que les seuils déjà atteints, triés croissants', () => {
    // synapse : proj 31 $, plafond 25 $ ⇒ 124 %
    expect(seuilsFranchis([50, 80, 90, 100], 31, 25)).toEqual([50, 80, 90, 100]);
    // audit_code : proj 58 $, plafond 60 $ ⇒ 96,67 %
    expect(seuilsFranchis([50, 80, 90, 100], 58, 60)).toEqual([50, 80, 90]);
  });

  it('cas limite : aucun seuil configuré ⇒ liste vide', () => {
    expect(seuilsFranchis([], 100, 50)).toEqual([]);
  });

  it("cas erreur : plafond nul ⇒ tous les seuils sont considérés franchis (projection jugée infinie)", () => {
    expect(seuilsFranchis([50, 80], 10, 0)).toEqual([50, 80]);
  });
});

describe('resteBudget', () => {
  it('cas nominal : plafond non consommé', () => {
    expect(resteBudget(100, 40)).toBe(60);
  });

  it('cas limite : consommé exactement au plafond', () => {
    expect(resteBudget(100, 100)).toBe(0);
  });

  it('cas erreur : consommé au-delà du plafond ⇒ reste négatif', () => {
    expect(resteBudget(25, 30)).toBe(-5);
  });
});

describe('pctConsomme / pctProjection', () => {
  it('cas nominal', () => {
    expect(pctConsomme(22.9, 25)).toBeCloseTo(91.6, 1);
    expect(pctProjection(31, 25)).toBe(100); // borné à 100 pour la jauge
  });

  it('cas limite : exactement au plafond ⇒ 100', () => {
    expect(pctConsomme(60, 60)).toBe(100);
  });

  it('cas erreur : plafond nul ⇒ 100 par convention plutôt que de diviser par zéro', () => {
    expect(pctConsomme(10, 0)).toBe(100);
    expect(pctProjection(10, 0)).toBe(100);
  });
});

describe('verdictBudget', () => {
  it('cas nominal : projection en dessous du plafond (Équipe AVV : 942 $ / 1200 $)', () => {
    const texte = verdictBudget({ plafond: 1200, consomme: 314.0, projection: 942 });
    expect(texte).toBe(
      'Au rythme actuel, le cycle se termine à 942 $, soit 79 % du plafond. Marge restante : 258 $.',
    );
  });

  it('cas nominal : projection au-dessus du plafond (synapse : 31 $ / 25 $)', () => {
    const texte = verdictBudget({ plafond: 25, consomme: 22.9, projection: 31 });
    expect(texte).toBe(
      'Au rythme actuel, le cycle se termine à 31 $, soit 24 % au-dessus du plafond. Il reste 2,10 $ avant blocage.',
    );
  });

  it('cas limite : projection exactement égale au plafond (branche « en dessous », marge nulle)', () => {
    const texte = verdictBudget({ plafond: 60, consomme: 60, projection: 60 });
    expect(texte).toBe(
      'Au rythme actuel, le cycle se termine à 60 $, soit 100 % du plafond. Marge restante : 0 $.',
    );
  });

  it("cas erreur : plafond nul ne fait pas planter la phrase", () => {
    expect(() => verdictBudget({ plafond: 0, consomme: 10, projection: 10 })).not.toThrow();
    expect(typeof verdictBudget({ plafond: 0, consomme: 10, projection: 10 })).toBe('string');
  });
});
