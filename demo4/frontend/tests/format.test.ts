import { describe, expect, it } from 'vitest';

import {
  date,
  delta,
  duree,
  heure,
  montant,
  montantCourt,
  plage,
  pourcentage,
  tokensMillions,
} from '../src/format';

const ESPACE_FINE_INSECABLE = ' ';
const MOINS = '−';

describe('montant', () => {
  it('formate un montant courant avec deux décimales et le symbole dollar', () => {
    expect(montant(1234.5)).toBe(`1${ESPACE_FINE_INSECABLE}234,50 $`);
  });

  it('formate zéro', () => {
    expect(montant(0)).toBe('0,00 $');
  });

  it('formate un montant négatif avec le signe moins typographique', () => {
    expect(montant(-42.1)).toBe(`${MOINS}42,10 $`);
  });

  it('formate un très grand montant avec les milliers séparés', () => {
    expect(montant(1234567.891)).toBe(`1${ESPACE_FINE_INSECABLE}234${ESPACE_FINE_INSECABLE}567,89 $`);
  });
});

describe('montantCourt', () => {
  it('formate sans le symbole dollar', () => {
    expect(montantCourt(942)).toBe('942,00');
  });

  it('formate zéro sans symbole', () => {
    expect(montantCourt(0)).toBe('0,00');
  });
});

describe('tokensMillions', () => {
  it('convertit un compteur de tokens en millions avec une décimale', () => {
    expect(tokensMillions(125_600_000)).toBe('125,6 M');
  });

  it('formate zéro token', () => {
    expect(tokensMillions(0)).toBe('0,0 M');
  });

  it('formate un très grand volume de tokens', () => {
    expect(tokensMillions(9_876_543_210)).toBe(`9${ESPACE_FINE_INSECABLE}876,5 M`);
  });

  it('reste positif même sur un nombre négatif (compteur théoriquement impossible)', () => {
    expect(tokensMillions(-2_000_000)).toBe(`${MOINS}2,0 M`);
  });
});

describe('pourcentage', () => {
  it('formate un pourcentage avec une décimale par défaut', () => {
    expect(pourcentage(78.4)).toBe('78,4 %');
  });

  it('accepte un nombre de décimales explicite', () => {
    expect(pourcentage(78, 0)).toBe('78 %');
  });

  it('formate zéro pour cent', () => {
    expect(pourcentage(0)).toBe('0,0 %');
  });
});

describe('delta', () => {
  it('préfixe une variation positive par un plus', () => {
    expect(delta(12.3)).toBe('+12,3 %');
  });

  it('préfixe une variation négative par le signe moins typographique', () => {
    expect(delta(-4.2)).toBe(`${MOINS}4,2 %`);
  });

  it('traite zéro comme une variation positive', () => {
    expect(delta(0)).toBe('+0,0 %');
  });
});

describe('date', () => {
  it('formate une date ISO sans heure', () => {
    expect(date('2026-09-09')).toBe('9 sept. 2026');
  });

  it('formate une date avec un horodatage complet', () => {
    expect(date('2026-01-01T00:00:00Z')).toBe('1 janv. 2026');
  });

  it('formate le dernier jour de l’année', () => {
    expect(date('2025-12-31')).toBe('31 déc. 2025');
  });
});

describe('heure', () => {
  it('formate une heure sur deux chiffres', () => {
    expect(heure('2026-09-09T14:02:00Z')).toBe('14:02');
  });

  it('complète les minutes à un chiffre par un zéro', () => {
    expect(heure('2026-09-09T09:05:00Z')).toBe('09:05');
  });

  it('formate minuit', () => {
    expect(heure('2026-09-09T00:00:00Z')).toBe('00:00');
  });
});

describe('plage', () => {
  it('condense une plage dans le même mois', () => {
    expect(plage('2026-09-01', '2026-09-10')).toBe('1 → 10 sept. 2026');
  });

  it('affiche les deux mois quand la plage change de mois', () => {
    expect(plage('2026-08-28', '2026-09-03')).toBe('28 août → 3 sept. 2026');
  });

  it('affiche les deux années quand la plage change d’année', () => {
    expect(plage('2025-12-28', '2026-01-03')).toBe('28 déc. 2025 → 3 janv. 2026');
  });
});

describe('duree', () => {
  it('affiche des minutes sous une heure', () => {
    expect(duree('2026-09-09T14:00:00Z', '2026-09-09T14:45:00Z')).toBe('45 min');
  });

  it('affiche des heures et des minutes au-delà d’une heure', () => {
    expect(duree('2026-09-09T14:02:00Z', '2026-09-09T16:41:00Z')).toBe('2 h 39');
  });

  it('affiche une durée nulle quand début et fin sont identiques', () => {
    expect(duree('2026-09-09T14:00:00Z', '2026-09-09T14:00:00Z')).toBe('0 min');
  });

  it('ne devient jamais négative si la fin précède le début', () => {
    expect(duree('2026-09-09T14:00:00Z', '2026-09-09T13:00:00Z')).toBe('0 min');
  });
});
