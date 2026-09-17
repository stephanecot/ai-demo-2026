import { beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from '../src/server.js';
import { reinitialisePourLesTests } from '../src/services/depot.js';

// Contrôles transverses : ils ne redisent pas ce que `routes.test.ts` couvre
// déjà route par route, mais vérifient ce qui doit rester vrai *entre* les
// routes — l'invariant du plan (§3) et la forme unique des erreurs (§4.3).

beforeEach(() => {
  delete process.env['TOKENOMETRE_TRANSCRIPTS'];
  reinitialisePourLesTests();
});

describe('forme des erreurs', () => {
  it('cas nominal : toute route inconnue sous /api renvoie 404 au format { erreur }', async () => {
    const reponse = await request(app).get('/api/ceci-nexiste-pas');
    expect(reponse.status).toBe(404);
    expect(Object.keys(reponse.body)).toEqual(['erreur']);
    expect(reponse.body.erreur).toMatch(/\.$/);
    expect(reponse.body.erreur).not.toMatch(/[A-Za-z]:\\/); // jamais de chemin absolu Windows
    expect(reponse.body.erreur).not.toMatch(/stack|at Object/);
  });

  it('cas limite : un message d’erreur ne fuite jamais la stack ni un chemin', async () => {
    const reponse = await request(app).get('/api/resume?debut=2026-99-99&fin=2026-09-10');
    expect(reponse.status).toBe(400);
    expect(reponse.body).not.toHaveProperty('stack');
    expect(reponse.body.erreur).not.toMatch(/[A-Za-z]:\\|\/home\/|\/Users\//);
  });

  it('cas erreur : jamais de 500 pour une mauvaise saisie (date, plafond, identifiant)', async () => {
    const dateInvalide = await request(app).get('/api/projets?debut=nimportequoi&fin=2026-09-10');
    const plafondInvalide = await request(app).patch('/api/budgets/synapse').send({ plafond: -5 });
    const sessionInconnue = await request(app).get('/api/sessions/xxxxx');
    expect(dateInvalide.status).not.toBe(500);
    expect(plafondInvalide.status).not.toBe(500);
    expect(sessionInconnue.status).not.toBe(500);
  });
});

describe('invariant : total période = somme des jours = somme des projets = somme des modèles', () => {
  it('cas nominal : le cycle par défaut retombe sur le même total par toutes les voies', async () => {
    const [resume, projets, agents] = await Promise.all([
      request(app).get('/api/resume'),
      request(app).get('/api/projets'),
      request(app).get('/api/agents'),
    ]);

    const total = resume.body.cout as number;
    const sommeProjets = (projets.body.projets as { cout: number }[]).reduce((t, p) => t + p.cout, 0);
    const sommeAgents = (agents.body.agents as { cout: number }[]).reduce((t, a) => t + a.cout, 0);
    const sommeModeles = (resume.body.parModele as { cout: number }[]).reduce((t, m) => t + m.cout, 0);
    const sommeJours = (resume.body.parJour as { cout: number }[]).reduce((t, j) => t + j.cout, 0);

    // Chaque ligne publiée est arrondie au millième : additionner n lignes ne
    // peut s'écarter du total que de n demi-millièmes, pas davantage. Une
    // tolérance forfaitaire de 0,01 $ laissait passer une dérive réelle de
    // 0,003 $ due à un arrondi refait à chaque addition interne.
    const marge = (lignes: number): number => lignes * 0.0005;
    expect(Math.abs(sommeProjets - total)).toBeLessThanOrEqual(marge(projets.body.projets.length));
    expect(Math.abs(sommeAgents - total)).toBeLessThanOrEqual(marge(agents.body.agents.length));
    expect(Math.abs(sommeModeles - total)).toBeLessThanOrEqual(marge(resume.body.parModele.length));
    expect(Math.abs(sommeJours - total)).toBeLessThanOrEqual(marge(resume.body.parJour.length));
  });

  it("cas limite : sur une période partielle (3 jours), l'export CSV retombe sur le même total que le résumé", async () => {
    const debut = '2026-09-08';
    const fin = '2026-09-10';
    const [resume, csv] = await Promise.all([
      request(app).get(`/api/resume?debut=${debut}&fin=${fin}`),
      request(app).get(`/api/export.csv?debut=${debut}&fin=${fin}`),
    ]);
    const lignes = csv.text.slice(1).split('\r\n').filter((l) => l.length > 0);
    const [, ...corps] = lignes;
    const totalCsv = corps.reduce((t, ligne) => {
      const champs = ligne.split(';');
      const cout = Number(champs[2]?.replace(',', '.'));
      return t + cout;
    }, 0);
    // Même règle que ci-dessus : le CSV a une ligne par couple (jour, modèle),
    // chacune arrondie au millième.
    expect(Math.abs(totalCsv - (resume.body.cout as number))).toBeLessThanOrEqual(corps.length * 0.0005);
  });

  it('cas nominal : les coûts du jeu d’exemple retombent sur les chiffres des maquettes', async () => {
    // `data/jeu-exemple.ts` est calibré sur `design/Main.dc.html` : 314,0 $ de
    // total, réparti en six projets aux montants exacts de la maquette. Le test
    // fige ces cibles — un arrondi intermédiaire réintroduit ailleurs les
    // décalerait de quelques millièmes, ce qui est précisément ce qu'on
    // interdit.
    const [resume, projets] = await Promise.all([
      request(app).get('/api/resume'),
      request(app).get('/api/projets'),
    ]);
    expect(resume.body.cout).toBe(314);
    const parNom = new Map(
      (projets.body.projets as { projet: string; cout: number }[]).map((p) => [p.projet, p.cout]),
    );
    expect(parNom.get('gcmt-backend-simulation')).toBe(112.4);
    expect(parNom.get('enerflex-demo3')).toBe(68.2);
    expect(parNom.get('ai-demo-2026')).toBe(54.8);
    expect(parNom.get('audit_code')).toBe(41.1);
    expect(parNom.get('synapse')).toBe(22.9);
    expect(parNom.get('divers / hors projet')).toBe(14.6);
  });

  it('cas erreur : une période sans donnée retombe sur 0 partout à la fois, sans diverger', async () => {
    const [resume, projets, agents] = await Promise.all([
      request(app).get('/api/resume?debut=2026-01-01&fin=2026-01-02'),
      request(app).get('/api/projets?debut=2026-01-01&fin=2026-01-02'),
      request(app).get('/api/agents?debut=2026-01-01&fin=2026-01-02'),
    ]);
    expect(resume.body.cout).toBe(0);
    expect(projets.body.projets).toEqual([]);
    expect(agents.body.agents).toEqual([]);
    expect(agents.body.outils).toEqual([]);
  });
});

describe('plausibilité des chiffres (jeu d’exemple)', () => {
  it('un coût journalier ne dépasse pas quelques dizaines de dollars', async () => {
    const reponse = await request(app).get('/api/resume');
    for (const jour of reponse.body.parJour as { cout: number }[]) {
      expect(jour.cout).toBeLessThan(100);
    }
  });

  it('la part de cache globale reste dans une plage plausible (40–95 %)', async () => {
    const reponse = await request(app).get('/api/resume');
    expect(reponse.body.partCache).toBeGreaterThan(40);
    expect(reponse.body.partCache).toBeLessThan(95);
  });
});

describe('PATCH /api/budgets/:id — persistance en mémoire', () => {
  it('un plafond mis à jour est visible sur un GET ultérieur, tant que le dépôt n’est pas réinitialisé', async () => {
    const avant = await request(app).get('/api/budgets');
    const budgetAvant = (avant.body.budgets as { id: string; plafond: number }[]).find((b) => b.id === 'synapse');
    expect(budgetAvant?.plafond).toBe(25);

    const patch = await request(app).patch('/api/budgets/synapse').send({ plafond: 40 });
    expect(patch.status).toBe(200);
    expect(patch.body.plafond).toBe(40);

    const apres = await request(app).get('/api/budgets');
    const budgetApres = (apres.body.budgets as { id: string; plafond: number }[]).find((b) => b.id === 'synapse');
    expect(budgetApres?.plafond).toBe(40);
  });
});

describe('GET /api/export.csv — cohérence avec /api/reglages', () => {
  it('les modèles du CSV sont ceux annoncés par /api/reglages, jamais un tarif inventé', async () => {
    const [reglages, csv] = await Promise.all([
      request(app).get('/api/reglages'),
      request(app).get('/api/export.csv'),
    ]);
    const libellesConnus = new Set(
      (reglages.body.modeles as { libelle: string }[]).map((m) => m.libelle),
    );
    const lignes = csv.text.slice(1).split('\r\n').filter((l) => l.length > 0);
    const [, ...corps] = lignes;
    for (const ligne of corps) {
      const libelleModele = ligne.split(';')[1];
      expect(libelleModele).toBeDefined();
      expect(libellesConnus.has(libelleModele ?? '')).toBe(true);
    }
  });
});
