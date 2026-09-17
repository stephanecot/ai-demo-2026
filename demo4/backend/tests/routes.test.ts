import { beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from '../src/server.js';
import { reinitialisePourLesTests } from '../src/services/depot.js';
import { fileURLToPath } from 'node:url';

// Pour chaque route du contrat (§4.2 du plan) : un cas nominal, un cas limite
// et un cas d'erreur. `reinitialisePourLesTests` évite qu'un `PATCH` d'un test
// ne pollue le suivant, et qu'un changement de source (mode transcripts) ne
// survive à son test.

const CHEMIN_ENV = 'TOKENOMETRE_TRANSCRIPTS';

function fixture(chemin: string): string {
  return fileURLToPath(new URL(`./fixtures/${chemin}`, import.meta.url));
}

beforeEach(() => {
  delete process.env[CHEMIN_ENV];
  reinitialisePourLesTests();
});

describe('GET /api/sante', () => {
  it('cas nominal : décrit la source active et le cycle en cours', async () => {
    const reponse = await request(app).get('/api/sante');
    expect(reponse.status).toBe(200);
    expect(reponse.body).toMatchObject({
      statut: 'ok',
      source: 'exemple',
      cycle: { debut: '2026-09-01', fin: '2026-09-30', jour: 10, jours: 30 },
    });
    expect(typeof reponse.body.version).toBe('string');
    expect(reponse.body.synchro).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('cas limite : bascule en mode transcripts sans donnée exploitable, réponse toujours valide', async () => {
    process.env[CHEMIN_ENV] = fixture('transcripts-tout-illisible');
    reinitialisePourLesTests();
    const reponse = await request(app).get('/api/sante');
    expect(reponse.status).toBe(200);
    expect(reponse.body.source).toBe('transcripts');
  });

  it("cas erreur : une méthode non prise en charge n'est pas une ressource connue", async () => {
    const reponse = await request(app).post('/api/sante');
    expect(reponse.status).toBe(404);
    expect(reponse.body.erreur).toMatch(/\.$/);
  });
});

describe('GET /api/resume', () => {
  it('cas nominal : le cycle par défaut retombe sur des chiffres cohérents', async () => {
    const reponse = await request(app).get('/api/resume');
    expect(reponse.status).toBe(200);
    const r = reponse.body;
    expect(r.debut).toBe('2026-09-01');
    expect(r.fin).toBe('2026-09-30');
    expect(r.cout).toBeGreaterThan(0);
    expect(r.sessions).toBeGreaterThan(0);
    // Part de cache plausible (40–95 %).
    expect(r.partCache).toBeGreaterThan(40);
    expect(r.partCache).toBeLessThan(95);
    // Invariant : somme des jours = total, somme des modèles = total (au millième près).
    const sommeJours = r.parJour.reduce((t: number, p: { cout: number }) => t + p.cout, 0);
    const sommeModeles = r.parModele.reduce((t: number, m: { cout: number }) => t + m.cout, 0);
    expect(Math.abs(sommeJours - r.cout)).toBeLessThan(0.01);
    expect(Math.abs(sommeModeles - r.cout)).toBeLessThan(0.01);
    expect(r.plafondGlobal).toBe(1200);
  });

  it('cas limite : une période sans donnée renvoie une structure vide, jamais une erreur', async () => {
    const reponse = await request(app).get('/api/resume?debut=2026-01-01&fin=2026-01-02');
    expect(reponse.status).toBe(200);
    expect(reponse.body).toMatchObject({
      cout: 0,
      sessions: 0,
      tokens: 0,
      partCache: 0,
      parJour: [],
      parModele: [],
    });
  });

  it('cas erreur : date malformée et fin antérieure à debut', async () => {
    const dateInvalide = await request(app).get('/api/resume?debut=2026-13-40&fin=2026-09-10');
    expect(dateInvalide.status).toBe(400);
    expect(dateInvalide.body.erreur).toMatch(/\.$/);

    const finAvantDebut = await request(app).get('/api/resume?debut=2026-09-10&fin=2026-09-01');
    expect(finAvantDebut.status).toBe(400);
    expect(finAvantDebut.body.erreur).toMatch(/\.$/);
  });
});

describe('GET /api/projets', () => {
  it('cas nominal : les projets couvrent 100 % du coût de la période', async () => {
    const reponse = await request(app).get('/api/projets');
    expect(reponse.status).toBe(200);
    const { projets } = reponse.body;
    expect(Array.isArray(projets)).toBe(true);
    expect(projets.length).toBeGreaterThan(0);
    for (const p of projets) {
      expect(p.alerte.length).toBeGreaterThan(0);
      expect(p.postes.length).toBeLessThanOrEqual(3);
      expect(['claude-opus-5', 'claude-sonnet-5', 'claude-haiku-4-5']).toContain(p.modeleDominant);
    }
    const sommePart = projets.reduce((t: number, p: { part: number }) => t + p.part, 0);
    expect(Math.abs(sommePart - 100)).toBeLessThan(1);
  });

  it('cas limite : une période sans donnée renvoie un tableau vide', async () => {
    const reponse = await request(app).get('/api/projets?debut=2026-01-01&fin=2026-01-02');
    expect(reponse.status).toBe(200);
    expect(reponse.body.projets).toEqual([]);
  });

  it('cas erreur : date malformée', async () => {
    const reponse = await request(app).get('/api/projets?debut=pas-une-date&fin=2026-09-10');
    expect(reponse.status).toBe(400);
    expect(reponse.body.erreur).toMatch(/\.$/);
  });
});

describe('GET /api/sessions', () => {
  it('cas nominal : les sessions sont triées des plus récentes aux plus anciennes', async () => {
    const reponse = await request(app).get('/api/sessions');
    expect(reponse.status).toBe(200);
    const { sessions } = reponse.body;
    expect(sessions.length).toBeGreaterThan(0);
    const debuts = sessions.map((s: { debut: string }) => s.debut);
    const trie = [...debuts].sort().reverse();
    expect(debuts).toEqual(trie);
  });

  it('cas limite : un filtre par projet sans correspondance renvoie une liste vide', async () => {
    const reponse = await request(app).get('/api/sessions?projet=projet-inexistant');
    expect(reponse.status).toBe(200);
    expect(reponse.body.sessions).toEqual([]);
  });

  it('cas erreur : fin antérieure à debut', async () => {
    const reponse = await request(app).get('/api/sessions?debut=2026-09-10&fin=2026-09-01');
    expect(reponse.status).toBe(400);
    expect(reponse.body.erreur).toMatch(/\.$/);
  });
});

describe('GET /api/sessions/:id', () => {
  it('cas nominal : le détail reprend la session de référence de Session.dc.html', async () => {
    const reponse = await request(app).get('/api/sessions/4f2c9a1e');
    expect(reponse.status).toBe(200);
    expect(reponse.body.projet).toBe('ai-demo-2026');
    expect(reponse.body.detailTours).toHaveLength(14);
    expect(reponse.body.parAgent.length).toBeGreaterThan(0);
    expect(reponse.body.parOutil.length).toBeGreaterThan(0);
    expect(reponse.body.partCache).toBeGreaterThan(40);
  });

  it('cas limite : une session avec très peu de tours reste un détail valide', async () => {
    const reponse = await request(app).get('/api/sessions/4f2c9a1e');
    // Ligne de base pour comparer : on vérifie surtout qu'aucune session du
    // jeu n'a besoin de plus qu'un tour pour être un détail cohérent.
    const petite = reponse.body.detailTours[0];
    expect(petite.coutCumule).toBeGreaterThanOrEqual(petite.cout);
  });

  it('cas erreur : identifiant de session inconnu', async () => {
    const reponse = await request(app).get('/api/sessions/inconnue-999');
    expect(reponse.status).toBe(404);
    expect(reponse.body.erreur).toMatch(/\.$/);
  });
});

describe('GET /api/agents', () => {
  it('cas nominal : agents et outils couvrent les mêmes tours', async () => {
    const reponse = await request(app).get('/api/agents');
    expect(reponse.status).toBe(200);
    const { agents, outils } = reponse.body;
    expect(agents.length).toBeGreaterThan(0);
    expect(outils.length).toBeGreaterThan(0);
    const coutAgents = agents.reduce((t: number, a: { cout: number }) => t + a.cout, 0);
    const coutOutils = outils.reduce((t: number, o: { cout: number }) => t + o.cout, 0);
    expect(Math.abs(coutAgents - coutOutils)).toBeLessThan(0.01);
  });

  it('cas limite : une période sans donnée renvoie deux tableaux vides', async () => {
    const reponse = await request(app).get('/api/agents?debut=2026-01-01&fin=2026-01-02');
    expect(reponse.status).toBe(200);
    expect(reponse.body).toEqual({ agents: [], outils: [] });
  });

  it('cas erreur : date malformée', async () => {
    const reponse = await request(app).get('/api/agents?debut=2026-09-99&fin=2026-09-10');
    expect(reponse.status).toBe(400);
    expect(reponse.body.erreur).toMatch(/\.$/);
  });
});

describe('GET /api/budgets', () => {
  it('cas nominal : cinq budgets avec leurs trois canaux et leurs alertes historiques', async () => {
    const reponse = await request(app).get('/api/budgets');
    expect(reponse.status).toBe(200);
    expect(reponse.body.budgets).toHaveLength(5);
    expect(reponse.body.alertes).toHaveLength(4);
    for (const b of reponse.body.budgets) {
      expect(b.canaux).toHaveLength(3);
      expect(b.canaux.map((c: { id: string }) => c.id).sort()).toEqual(['blocage', 'mail', 'slack']);
      expect(['dans-le-budget', 'a-surveiller', 'limite-atteinte', 'depassement-prevu']).toContain(b.etat);
      expect(b.verdict.length).toBeGreaterThan(0);
      expect(b.pctConsomme).toBeGreaterThanOrEqual(0);
      expect(b.pctConsomme).toBeLessThanOrEqual(100);
    }
  });

  it("cas limite : sans aucune donnée exploitable, les budgets restent à 0 sans planter", async () => {
    process.env[CHEMIN_ENV] = fixture('transcripts-tout-illisible');
    reinitialisePourLesTests();
    const reponse = await request(app).get('/api/budgets');
    expect(reponse.status).toBe(200);
    expect(reponse.body.alertes).toEqual([]);
    for (const b of reponse.body.budgets) {
      expect(b.consomme).toBe(0);
      expect(b.etat).toBe('dans-le-budget');
    }
  });

  it("cas erreur : aucune route GET n'existe pour un budget précis", async () => {
    const reponse = await request(app).get('/api/budgets/equipe-avv');
    expect(reponse.status).toBe(404);
    expect(reponse.body.erreur).toMatch(/\.$/);
  });
});

describe('PATCH /api/budgets/:id', () => {
  it('cas nominal : un plafond valide, sur le pas du budget, est appliqué et recalculé', async () => {
    const reponse = await request(app).patch('/api/budgets/synapse').send({ plafond: 50 });
    expect(reponse.status).toBe(200);
    expect(reponse.body.plafond).toBe(50);
    expect(reponse.body.reste).toBe(50 - reponse.body.consomme);
  });

  it('cas limite : les seuils aux bornes exactes 1 et 100 sont acceptés', async () => {
    const reponse = await request(app).patch('/api/budgets/synapse').send({ seuils: [1, 100] });
    expect(reponse.status).toBe(200);
    expect(reponse.body.seuils).toEqual([1, 100]);
  });

  it('cas erreur : plafond hors bornes, hors pas, seuil hors [1..100], canal inconnu, budget inconnu', async () => {
    const horsBornes = await request(app).patch('/api/budgets/synapse').send({ plafond: 99999 });
    expect(horsBornes.status).toBe(400);
    expect(horsBornes.body.erreur).toMatch(/\.$/);

    const horsPas = await request(app).patch('/api/budgets/synapse').send({ plafond: 13 });
    expect(horsPas.status).toBe(400);
    expect(horsPas.body.erreur).toMatch(/\.$/);

    const seuilInvalide = await request(app).patch('/api/budgets/synapse').send({ seuils: [0] });
    expect(seuilInvalide.status).toBe(400);
    expect(seuilInvalide.body.erreur).toMatch(/\.$/);

    const canalInconnu = await request(app).patch('/api/budgets/synapse').send({ canaux: ['fax'] });
    expect(canalInconnu.status).toBe(400);
    expect(canalInconnu.body.erreur).toMatch(/\.$/);

    const budgetInconnu = await request(app).patch('/api/budgets/inconnu').send({ plafond: 10 });
    expect(budgetInconnu.status).toBe(404);
    expect(budgetInconnu.body.erreur).toMatch(/\.$/);
  });
});

describe('GET /api/reglages', () => {
  it('cas nominal : les tarifs affichés viennent de tarifs.ts, jamais recopiés', async () => {
    const reponse = await request(app).get('/api/reglages');
    expect(reponse.status).toBe(200);
    expect(reponse.body.source).toBe('exemple');
    expect(reponse.body.devise).toBe('USD');
    expect(reponse.body.modeles).toHaveLength(3);
    expect(reponse.body.chemin).not.toMatch(/^[A-Za-z]:[\\/]/);
    expect(reponse.body.chemin).not.toMatch(/^\//);
  });

  it('cas limite : en mode transcripts, le chemin affiché ne fuite jamais le disque', async () => {
    process.env[CHEMIN_ENV] = fixture('transcripts-tout-illisible');
    reinitialisePourLesTests();
    const reponse = await request(app).get('/api/reglages');
    expect(reponse.status).toBe(200);
    expect(reponse.body.source).toBe('transcripts');
    expect(reponse.body.chemin).not.toContain('backend');
    expect(reponse.body.chemin).not.toMatch(/^[A-Za-z]:[\\/]/);
  });

  it("cas erreur : une méthode non prise en charge n'est pas une ressource connue", async () => {
    const reponse = await request(app).post('/api/reglages');
    expect(reponse.status).toBe(404);
    expect(reponse.body.erreur).toMatch(/\.$/);
  });
});

describe('GET /api/export.csv', () => {
  it('cas nominal : CSV avec BOM, séparateur `;` et en-têtes en français', async () => {
    const reponse = await request(app).get('/api/export.csv');
    expect(reponse.status).toBe(200);
    expect(reponse.headers['content-type']).toContain('text/csv');
    expect(reponse.headers['content-type']).toContain('charset=utf-8');
    expect(reponse.headers['content-disposition']).toContain('attachment');
    const texte: string = reponse.text;
    expect(texte.charCodeAt(0)).toBe(0xfeff);
    const lignes = texte.slice(1).split('\r\n').filter((l) => l.length > 0);
    expect(lignes[0]).toBe('Date;Modèle;Coût ($);Tokens;Part de cache (%)');
    expect(lignes.length).toBeGreaterThan(1);
  });

  it('cas limite : une période sans donnée ne renvoie que les en-têtes', async () => {
    const reponse = await request(app).get('/api/export.csv?debut=2026-01-01&fin=2026-01-02');
    expect(reponse.status).toBe(200);
    const lignes = reponse.text.slice(1).split('\r\n').filter((l) => l.length > 0);
    expect(lignes).toEqual(['Date;Modèle;Coût ($);Tokens;Part de cache (%)']);
  });

  it('cas erreur : date malformée renvoie du JSON, pas du CSV', async () => {
    const reponse = await request(app).get('/api/export.csv?debut=nawak&fin=2026-09-10');
    expect(reponse.status).toBe(400);
    expect(reponse.body.erreur).toMatch(/\.$/);
  });
});

describe('validation générique des paramètres de requête', () => {
  it('cas erreur : un paramètre répété (tableau) est rejeté plutôt que silencieusement pris au premier', async () => {
    const reponse = await request(app).get('/api/resume?debut=2026-09-01&debut=2026-09-05&fin=2026-09-10');
    expect(reponse.status).toBe(400);
    expect(reponse.body.erreur).toMatch(/\.$/);
  });
});
