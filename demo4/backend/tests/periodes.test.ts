import { describe, expect, it } from 'vitest';
import { RequeteInvalide } from '../src/erreurs.js';
import {
  AUJOURD_HUI_PAR_DEFAUT,
  bornesPeriode,
  cycleEnCours,
  dureeEnJours,
  estDateValide,
  joursEcoules,
  periodePrecedente,
  validerDate,
} from '../src/services/periodes.js';

describe('estDateValide', () => {
  it('cas nominal : accepte une date calendaire réelle', () => {
    expect(estDateValide('2026-09-10')).toBe(true);
  });

  it("cas limite : refuse un jour qui n'existe pas dans le mois (31 septembre)", () => {
    expect(estDateValide('2026-09-31')).toBe(false);
  });

  it('cas erreur : refuse un format qui ne suit pas AAAA-MM-JJ', () => {
    expect(estDateValide('10/09/2026')).toBe(false);
    expect(estDateValide('pas une date')).toBe(false);
  });
});

describe('validerDate', () => {
  it('cas nominal : renvoie la date quand elle est valide', () => {
    expect(validerDate('2026-09-10', 'debut')).toBe('2026-09-10');
  });

  it('cas erreur : lève une RequeteInvalide en français, avec un point final', () => {
    expect(() => validerDate('2026-13-01', 'debut')).toThrow(RequeteInvalide);
    try {
      validerDate('2026-13-01', 'debut');
      throw new Error('devait lever une erreur');
    } catch (e) {
      expect(e).toBeInstanceOf(RequeteInvalide);
      expect((e as Error).message).toMatch(/\.$/);
      expect((e as Error).message).not.toMatch(/[a-zA-Z]:\\/); // pas de chemin absolu Windows
    }
  });
});

describe('cycleEnCours', () => {
  it('cas nominal : la valeur par défaut tombe sur le cycle de septembre 2026, jour 10 sur 30', () => {
    const cycle = cycleEnCours();
    expect(cycle).toEqual({ debut: '2026-09-01', fin: '2026-09-30', jour: 10, jours: 30 });
    expect(AUJOURD_HUI_PAR_DEFAUT).toBe('2026-09-10');
  });

  it('cas limite : un mois de 28 jours (février, année non bissextile)', () => {
    const cycle = cycleEnCours('2027-02-15');
    expect(cycle).toEqual({ debut: '2027-02-01', fin: '2027-02-28', jour: 15, jours: 28 });
  });

  it("cas erreur : une date d'aujourd'hui mal formée lève une RequeteInvalide", () => {
    expect(() => cycleEnCours('2026-09-31')).toThrow(RequeteInvalide);
  });
});

describe('bornesPeriode', () => {
  it('cas nominal : debut/fin fournis et valides sont renvoyés tels quels', () => {
    expect(bornesPeriode('2026-09-03', '2026-09-05')).toEqual({ debut: '2026-09-03', fin: '2026-09-05' });
  });

  it('cas limite : ni debut ni fin fournis ⇒ le cycle en cours', () => {
    expect(bornesPeriode(undefined, undefined)).toEqual({ debut: '2026-09-01', fin: '2026-09-30' });
  });

  it('cas erreur : fin antérieure à debut', () => {
    expect(() => bornesPeriode('2026-09-10', '2026-09-01')).toThrow(RequeteInvalide);
  });

  it("cas erreur : un seul des deux paramètres fourni", () => {
    expect(() => bornesPeriode('2026-09-01', undefined)).toThrow(RequeteInvalide);
  });
});

describe('dureeEnJours', () => {
  it('cas nominal : période de 10 jours inclusive', () => {
    expect(dureeEnJours('2026-09-01', '2026-09-10')).toBe(10);
  });

  it('cas limite : une seule journée vaut 1', () => {
    expect(dureeEnJours('2026-09-05', '2026-09-05')).toBe(1);
  });
});

describe('periodePrecedente', () => {
  it('cas nominal : la période de même durée qui précède immédiatement', () => {
    expect(periodePrecedente('2026-09-01', '2026-09-10')).toEqual({ debut: '2026-08-22', fin: '2026-08-31' });
  });

  it('cas limite : une période d’un jour', () => {
    expect(periodePrecedente('2026-09-05', '2026-09-05')).toEqual({ debut: '2026-09-04', fin: '2026-09-04' });
  });
});

describe('joursEcoules', () => {
  it("cas nominal : aujourd'hui au milieu de la période", () => {
    expect(joursEcoules('2026-09-01', '2026-09-30', '2026-09-10')).toBe(10);
  });

  it('cas limite : période entièrement dans le futur ⇒ 0 jour écoulé, sans donnée', () => {
    expect(joursEcoules('2026-10-01', '2026-10-31', '2026-09-10')).toBe(0);
  });

  it('cas limite : période déjà terminée ⇒ la durée complète', () => {
    expect(joursEcoules('2026-08-01', '2026-08-10', '2026-09-10')).toBe(10);
  });
});
