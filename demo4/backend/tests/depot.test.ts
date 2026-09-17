import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { fileURLToPath } from 'node:url';
import {
  alertes,
  budgets,
  metAJourBudget,
  reinitialisePourLesTests,
  sessions,
  source,
  synchro,
} from '../src/services/depot.js';
import { Introuvable, RequeteInvalide } from '../src/erreurs.js';

// depot.ts n'est pas dans la liste des fichiers de test listés par la mission,
// mais c'est un fichier de service que je possède (backend/src/services/depot.ts) :
// il a besoin de son propre filet de tests pour respecter la définition du fait.

const CHEMIN_ENV = 'TOKENOMETRE_TRANSCRIPTS';

function fixture(chemin: string): string {
  return fileURLToPath(new URL(`./fixtures/${chemin}`, import.meta.url));
}

describe('depot', () => {
  const valeurInitiale = process.env[CHEMIN_ENV];

  beforeEach(() => {
    reinitialisePourLesTests();
  });

  afterEach(() => {
    if (valeurInitiale === undefined) {
      delete process.env[CHEMIN_ENV];
    } else {
      process.env[CHEMIN_ENV] = valeurInitiale;
    }
    reinitialisePourLesTests();
  });

  it("cas nominal : sans variable d'environnement, sert le jeu d'exemple", async () => {
    delete process.env[CHEMIN_ENV];
    expect(await source()).toBe('exemple');
    const toutesLesSessions = await sessions();
    expect(toutesLesSessions.length).toBeGreaterThan(0);
    expect(await budgets()).toHaveLength(5);
    expect(await alertes()).toHaveLength(4);
    expect(await synchro()).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('cas limite : une variable pointant vers un dossier de transcripts bascule la source', async () => {
    process.env[CHEMIN_ENV] = fixture('transcripts-valides');
    expect(await source()).toBe('transcripts');
    const toutesLesSessions = await sessions();
    expect(toutesLesSessions.length).toBe(2);
    // Même en mode transcripts, les budgets restent ceux configurés pour l'organisation.
    expect(await budgets()).toHaveLength(5);
    expect(await alertes()).toEqual([]);
  });

  it("cas erreur : une variable pointant vers un chemin inexistant retombe sur le jeu d'exemple", async () => {
    process.env[CHEMIN_ENV] = fixture('ce-dossier-n-existe-pas');
    expect(await source()).toBe('exemple');
  });

  it('metAJourBudget — cas nominal : modifie le plafond en mémoire', async () => {
    delete process.env[CHEMIN_ENV];
    const misAJour = await metAJourBudget('synapse', { plafond: 40 });
    expect(misAJour.plafond).toBe(40);
    const relu = (await budgets()).find((b) => b.id === 'synapse');
    expect(relu?.plafond).toBe(40);
  });

  it('metAJourBudget — cas limite : ne change que les champs fournis', async () => {
    delete process.env[CHEMIN_ENV];
    const avant = (await budgets()).find((b) => b.id === 'synapse');
    const misAJour = await metAJourBudget('synapse', { seuils: [90] });
    expect(misAJour.seuils).toEqual([90]);
    expect(misAJour.plafond).toBe(avant?.plafond);
  });

  it("metAJourBudget — cas d'erreur : un identifiant inconnu lève une Introuvable", async () => {
    delete process.env[CHEMIN_ENV];
    await expect(metAJourBudget('inconnu', { plafond: 10 })).rejects.toBeInstanceOf(Introuvable);
  });

  it('metAJourBudget — cas d’erreur : un plafond hors bornes lève une RequeteInvalide', async () => {
    delete process.env[CHEMIN_ENV];
    await expect(metAJourBudget('synapse', { plafond: 5 })).rejects.toBeInstanceOf(RequeteInvalide);
    await expect(metAJourBudget('synapse', { plafond: 9999 })).rejects.toBeInstanceOf(RequeteInvalide);
  });
});
