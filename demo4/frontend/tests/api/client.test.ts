import { afterEach, describe, expect, it, vi } from 'vitest';

import { requeteApi, requeteApiPatch, requeteApiTexte } from '../../src/api/client';
import { recupereAgents } from '../../src/api/agents';
import { modifieBudget, recupereBudgets } from '../../src/api/budgets';
import { recupereProjets } from '../../src/api/projets';
import { recupereReglages } from '../../src/api/reglages';
import { recupereExportCsv, recupereResume } from '../../src/api/resume';
import { recupereSante } from '../../src/api/sante';
import { recupereSession, recupereSessions } from '../../src/api/sessions';

/**
 * `src/api/` est la couture entre les écrans et le backend : c'est le seul
 * endroit du frontend qui connaisse la forme des URL du §4.2 du plan et la
 * forme d'erreur `{ erreur }` du §4.3. Ces tests portent sur ces règles-là —
 * quelle URL part, ce qui est omis, quel message remonte — et pas sur des
 * accesseurs.
 */

/** Remplace `fetch` et retient les appels ; renvoie la réponse demandée. */
function simuleFetch(reponse: Partial<Response> & { corps?: unknown; texte?: string }) {
  const appels: { url: string; init?: RequestInit }[] = [];
  const faux = vi.fn(async (url: string, init?: RequestInit) => {
    appels.push({ url, ...(init !== undefined ? { init } : {}) });
    return {
      ok: reponse.ok ?? true,
      status: reponse.status ?? 200,
      json: async () => {
        if ('corps' in reponse) return reponse.corps;
        throw new SyntaxError('corps non JSON');
      },
      text: async () => reponse.texte ?? '',
    } as Response;
  });
  vi.stubGlobal('fetch', faux);
  return appels;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('construction des URL', () => {
  it('cas nominal : préfixe /api et sérialise les paramètres fournis', async () => {
    const appels = simuleFetch({ corps: { cout: 314 } });
    await recupereResume({ debut: '2026-09-01', fin: '2026-09-10' });
    expect(appels[0]?.url).toBe('/api/resume?debut=2026-09-01&fin=2026-09-10');
  });

  it('cas limite : un paramètre absent est omis, jamais envoyé comme « undefined »', async () => {
    const appels = simuleFetch({ corps: { projets: [] } });
    await recupereProjets({ debut: '2026-09-01' });
    expect(appels[0]?.url).toBe('/api/projets?debut=2026-09-01');
    expect(appels[0]?.url).not.toContain('undefined');
  });

  it('cas limite : tous les paramètres absents donnent une URL sans « ? »', async () => {
    const appels = simuleFetch({ corps: { sessions: [] } });
    await recupereSessions();
    expect(appels[0]?.url).toBe('/api/sessions');
  });

  it("cas limite : l'identifiant de session est encodé, jamais concaténé tel quel", async () => {
    const appels = simuleFetch({ corps: { id: 'a b' } });
    await recupereSession('a b/../secret');
    expect(appels[0]?.url).toBe('/api/sessions/a%20b%2F..%2Fsecret');
  });

  it('cas nominal : chaque ressource vise la route du contrat', async () => {
    const appels = simuleFetch({ corps: { agents: [], outils: [], budgets: [], alertes: [], sessions: [] } });
    await recupereSante();
    await recupereAgents({ debut: '2026-09-01', fin: '2026-09-10' });
    await recupereBudgets();
    await recupereReglages();
    await recupereSessions({ projet: 'synapse' });
    expect(appels.map((a) => a.url)).toEqual([
      '/api/sante',
      '/api/agents?debut=2026-09-01&fin=2026-09-10',
      '/api/budgets',
      '/api/reglages',
      '/api/sessions?projet=synapse',
    ]);
  });
});

describe('remontée des erreurs du backend', () => {
  it('cas erreur : le message français du backend est propagé tel quel', async () => {
    simuleFetch({
      ok: false,
      status: 400,
      corps: { erreur: 'Le paramètre « fin » doit être postérieur ou égal à « debut ».' },
    });
    await expect(recupereResume({ debut: '2026-09-10', fin: '2026-09-01' })).rejects.toThrow(
      'Le paramètre « fin » doit être postérieur ou égal à « debut ».',
    );
  });

  it('cas limite : un corps non JSON retombe sur un message mentionnant le statut', async () => {
    simuleFetch({ ok: false, status: 502 });
    await expect(recupereProjets()).rejects.toThrow('Le serveur a répondu avec le statut 502.');
  });

  it('cas limite : un champ « erreur » vide retombe aussi sur le message de statut', async () => {
    simuleFetch({ ok: false, status: 500, corps: { erreur: '' } });
    await expect(requeteApi('/resume')).rejects.toThrow('Le serveur a répondu avec le statut 500.');
  });

  it("cas erreur : l'export CSV en échec lève le message du backend, pas le texte de la réponse", async () => {
    simuleFetch({ ok: false, status: 400, corps: { erreur: 'Période invalide.' }, texte: 'Date;Modèle' });
    await expect(recupereExportCsv({ debut: 'zzz', fin: '2026-09-10' })).rejects.toThrow('Période invalide.');
  });

  it('cas erreur : un PATCH refusé lève le message du backend', async () => {
    simuleFetch({ ok: false, status: 400, corps: { erreur: 'Le plafond doit être compris entre 10 et 150 pour ce budget.' } });
    await expect(modifieBudget('synapse', { plafond: 99_999 })).rejects.toThrow(
      'Le plafond doit être compris entre 10 et 150 pour ce budget.',
    );
  });
});

describe('méthodes et corps', () => {
  it('cas nominal : un GET ne porte ni corps ni en-tête de contenu', async () => {
    const appels = simuleFetch({ corps: { statut: 'ok' } });
    await recupereSante();
    expect(appels[0]?.init?.method).toBe('GET');
    expect(appels[0]?.init?.body).toBeUndefined();
  });

  it('cas nominal : un PATCH envoie du JSON et retourne le budget mis à jour', async () => {
    const appels = simuleFetch({ corps: { id: 'synapse', plafond: 40 } });
    const budget = await modifieBudget('synapse', { plafond: 40, canaux: ['mail'] });
    expect(appels[0]?.url).toBe('/api/budgets/synapse');
    expect(appels[0]?.init?.method).toBe('PATCH');
    expect(appels[0]?.init?.headers).toEqual({ 'Content-Type': 'application/json' });
    expect(appels[0]?.init?.body).toBe(JSON.stringify({ plafond: 40, canaux: ['mail'] }));
    expect(budget).toEqual({ id: 'synapse', plafond: 40 });
  });

  it("cas nominal : l'export CSV retourne le texte brut, sans passer par JSON", async () => {
    simuleFetch({ texte: 'Date;Modèle;Coût ($)\r\n2026-09-10;Opus 5;21,303' });
    const csv = await recupereExportCsv({ debut: '2026-09-10', fin: '2026-09-10' });
    expect(csv).toContain('Coût ($)');
  });

  it('cas limite : un signal d’abandon est transmis à fetch quand il est fourni', async () => {
    const appels = simuleFetch({ corps: {}, texte: '' });
    const controleur = new AbortController();
    await requeteApi('/resume', undefined, controleur.signal);
    await requeteApiTexte('/export.csv', undefined, controleur.signal);
    await requeteApiPatch('/budgets/synapse', { plafond: 40 }, controleur.signal);
    for (const appel of appels) {
      expect(appel.init?.signal).toBe(controleur.signal);
    }
  });
});

describe('dépliage des enveloppes de liste', () => {
  it('cas nominal : les listes sont rendues nues, l’enveloppe du contrat reste dans la couche api', async () => {
    simuleFetch({ corps: { projets: [{ projet: 'synapse', cout: 22.9 }] } });
    await expect(recupereProjets()).resolves.toEqual([{ projet: 'synapse', cout: 22.9 }]);

    simuleFetch({ corps: { sessions: [{ id: 'cd4e5f60' }] } });
    await expect(recupereSessions()).resolves.toEqual([{ id: 'cd4e5f60' }]);

    simuleFetch({ corps: { agents: [{ agent: 'principal' }], outils: [{ outil: 'Read' }] } });
    await expect(recupereAgents()).resolves.toEqual({
      agents: [{ agent: 'principal' }],
      outils: [{ outil: 'Read' }],
    });
  });
});
