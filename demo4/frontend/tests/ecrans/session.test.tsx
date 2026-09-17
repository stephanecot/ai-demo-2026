/**
 * Écran Session (détail) : les quatre états — dont le 404 d'une session
 * inconnue avec le message du backend —, le changement d'onglet, le
 * dépliage d'un tour et la sélection d'un point de la courbe de coût
 * cumulé, au clic comme au clavier.
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { REGLAGES, SESSION } from '../../src/labels';
import type { DetailSession, DetailTour, Reglages } from '../../src/types/api';

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetModules();
});

function tour(partiel: Partial<DetailTour> & Pick<DetailTour, 'index' | 'coutCumule' | 'cout'>): DetailTour {
  return {
    horodatage: '2026-09-09T14:05:00.000Z',
    modele: 'claude-opus-5',
    agent: 'principal',
    outil: 'Read',
    libelle: 'Lecture du brief et de la spec',
    usage: { entree: 14200, sortie: 2100, cacheEcriture: 46000, cacheLecture: 0 },
    ...partiel,
  };
}

function detailSession(partiel: Partial<DetailSession> = {}): DetailSession {
  const detailTours: readonly DetailTour[] = partiel.detailTours ?? [
    tour({ index: 0, cout: 1.234, coutCumule: 1.234, modele: 'claude-opus-5', agent: 'principal', outil: 'Read' }),
    tour({
      index: 1,
      cout: 2.5,
      coutCumule: 3.734,
      modele: 'claude-sonnet-5',
      agent: 'node-dev',
      outil: 'Edit',
      libelle: 'Service d’import et agrégation',
      usage: { entree: 2200, sortie: 9400, cacheEcriture: 3600, cacheLecture: 64000 },
    }),
    tour({
      index: 2,
      cout: 0.766,
      coutCumule: 4.5,
      modele: 'claude-haiku-4-5',
      agent: 'react-dev',
      outil: 'Bash',
      libelle: 'npm test -w backend',
      usage: { entree: 500, sortie: 300, cacheEcriture: 800, cacheLecture: 14000 },
    }),
  ];

  return {
    id: '4f2c9a1e',
    projet: 'ai-demo-2026/demo4',
    branche: 'feat/import-jsonl',
    debut: '2026-09-09T14:02:00.000Z',
    fin: '2026-09-09T16:41:00.000Z',
    tours: detailTours.length,
    cout: 4.5,
    tokens: 50_000_000,
    partCache: 40,
    detailTours,
    parAgent: [
      { agent: 'principal', cout: 1.234, appels: 1, parModele: { 'claude-opus-5': 1.234, 'claude-sonnet-5': 0, 'claude-haiku-4-5': 0 }, economieSiSonnet: 0 },
      { agent: 'node-dev', cout: 2.5, appels: 1, parModele: { 'claude-opus-5': 0, 'claude-sonnet-5': 2.5, 'claude-haiku-4-5': 0 }, economieSiSonnet: 0 },
      { agent: 'react-dev', cout: 0.766, appels: 1, parModele: { 'claude-opus-5': 0, 'claude-sonnet-5': 0, 'claude-haiku-4-5': 0.766 }, economieSiSonnet: 0 },
    ],
    parOutil: [
      { outil: 'Read', cout: 1.234, appels: 1 },
      { outil: 'Edit', cout: 2.5, appels: 1 },
      { outil: 'Bash', cout: 0.766, appels: 1 },
    ],
    ...partiel,
  };
}

function reglages(): Reglages {
  return {
    source: 'exemple',
    chemin: 'jeu-exemple',
    cycle: { debut: '2026-09-01', fin: '2026-09-30', jour: 9, jours: 30 },
    devise: 'USD',
    modeles: [
      { modele: 'claude-opus-5', libelle: 'Opus 5', tarif: { libelle: 'Opus 5', entree: 5, sortie: 25, cacheEcriture: 6.25, cacheLecture: 0.5 } },
      { modele: 'claude-sonnet-5', libelle: 'Sonnet 5', tarif: { libelle: 'Sonnet 5', entree: 2, sortie: 10, cacheEcriture: 2.5, cacheLecture: 0.2 } },
      { modele: 'claude-haiku-4-5', libelle: 'Haiku 4.5', tarif: { libelle: 'Haiku 4.5', entree: 1, sortie: 5, cacheEcriture: 1.25, cacheLecture: 0.1 } },
    ],
  };
}

function mockReglages(): void {
  vi.doMock('../../src/api/reglages', () => ({ recupereReglages: vi.fn(async () => reglages()) }));
}

async function monteEcran(id = '4f2c9a1e') {
  const module = await import('../../src/ecrans/Session');
  const Session = module.default;
  render(
    <MemoryRouter initialEntries={[`/sessions/${id}`]}>
      <Routes>
        <Route path="/sessions/:id" element={<Session />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('écran Session', () => {
  it('affiche le chargement puis le détail : en-tête, puce d’état, cinq tuiles', async () => {
    vi.doMock('../../src/api/sessions', () => ({ recupereSession: vi.fn(async () => detailSession()) }));
    mockReglages();

    await monteEcran();
    expect(screen.getByRole('status')).toBeInTheDocument();

    await waitFor(() => expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument());
    expect(screen.getByRole('heading', { level: 1, name: 'feat/import-jsonl' })).toBeInTheDocument();
    expect(screen.getByText(SESSION.chipTerminee)).toBeInTheDocument();
    expect(screen.getByText(SESSION.tuiles.coutSession)).toBeInTheDocument();
    expect(screen.getByText(SESSION.tuiles.tours)).toBeInTheDocument();
    expect(screen.getByText(SESSION.tuiles.tokens)).toBeInTheDocument();
    expect(screen.getByText(SESSION.tuiles.cache)).toBeInTheDocument();
    expect(screen.getByText(SESSION.tuiles.coutMoyenParTour)).toBeInTheDocument();
  });

  it('affiche le message du backend en 404 pour une session inconnue', async () => {
    vi.doMock('../../src/api/sessions', () => ({
      recupereSession: vi.fn(async () => {
        throw new Error('La session « inconnue » est introuvable.');
      }),
    }));
    mockReglages();

    await monteEcran('inconnue');

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('La session « inconnue » est introuvable.'));
  });

  it('affiche l’état vide quand la session ne contient aucun tour', async () => {
    vi.doMock('../../src/api/sessions', () => ({
      recupereSession: vi.fn(async () => detailSession({ detailTours: [], tours: 0 })),
    }));
    mockReglages();

    await monteEcran();

    await waitFor(() => expect(screen.getByText(SESSION.videTitre)).toBeInTheDocument());
    expect(screen.getByText(SESSION.videDetail)).toBeInTheDocument();
  });

  it('sélectionne le dernier tour par défaut et affiche le total cumulé', async () => {
    vi.doMock('../../src/api/sessions', () => ({ recupereSession: vi.fn(async () => detailSession()) }));
    mockReglages();

    await monteEcran();

    await waitFor(() => expect(screen.getByRole('listbox')).toBeInTheDocument());
    expect(screen.getByText(SESSION.graphique.tourSelectionne(3, '4,50'))).toBeInTheDocument();
    const points = screen.getAllByRole('option');
    expect(points).toHaveLength(3);
    expect(points[2]).toHaveAttribute('aria-selected', 'true');
  });

  it('sélectionne un autre tour au clic sur un point de la courbe', async () => {
    vi.doMock('../../src/api/sessions', () => ({ recupereSession: vi.fn(async () => detailSession()) }));
    mockReglages();

    await monteEcran();
    await waitFor(() => expect(screen.getAllByRole('option')).toHaveLength(3));

    const utilisateur = userEvent.setup();
    await utilisateur.click(screen.getAllByRole('option')[0] as HTMLElement);

    expect(screen.getByText(SESSION.graphique.tourSelectionne(1, '1,23'))).toBeInTheDocument();
  });

  it('sélectionne un point au clavier avec les flèches', async () => {
    vi.doMock('../../src/api/sessions', () => ({ recupereSession: vi.fn(async () => detailSession()) }));
    mockReglages();

    await monteEcran();
    await waitFor(() => expect(screen.getAllByRole('option')).toHaveLength(3));

    const points = screen.getAllByRole('option');
    (points[2] as HTMLElement).focus();
    const utilisateur = userEvent.setup();
    await utilisateur.keyboard('{ArrowLeft}');

    expect(screen.getByText(SESSION.graphique.tourSelectionne(2, '3,73'))).toBeInTheDocument();
  });

  it('change d’onglet vers « Par outil » et affiche les barres horizontales', async () => {
    vi.doMock('../../src/api/sessions', () => ({ recupereSession: vi.fn(async () => detailSession()) }));
    mockReglages();

    await monteEcran();
    await waitFor(() => expect(screen.getByRole('tablist')).toBeInTheDocument());

    const utilisateur = userEvent.setup();
    await utilisateur.click(screen.getByRole('tab', { name: SESSION.onglets.outils }));

    expect(screen.getByRole('tab', { name: SESSION.onglets.outils })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('Read')).toBeInTheDocument();
    expect(screen.getByText('Edit')).toBeInTheDocument();
    expect(screen.getByText('Bash')).toBeInTheDocument();
  });

  it('déplie un tour au clic et montre les quatre postes avec tokens et tarif', async () => {
    vi.doMock('../../src/api/sessions', () => ({ recupereSession: vi.fn(async () => detailSession()) }));
    mockReglages();

    await monteEcran();
    await waitFor(() => expect(screen.getByRole('table')).toBeInTheDocument());

    const ligne = screen.getByRole('button', { name: /Lecture du brief/ });
    expect(ligne).toHaveAttribute('aria-expanded', 'false');

    const utilisateur = userEvent.setup();
    await utilisateur.click(ligne);

    expect(ligne).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText(REGLAGES.colonneEntree)).toBeInTheDocument();
    expect(screen.getByText(REGLAGES.colonneSortie)).toBeInTheDocument();
    expect(screen.getByText(REGLAGES.colonneCacheEcriture)).toBeInTheDocument();
    expect(screen.getByText(REGLAGES.colonneCacheLecture)).toBeInTheDocument();
    // Le tarif $/M du premier tour (modèle Opus 5) vient de `/api/reglages`.
    await waitFor(() => expect(screen.getByText(`5,00 ${REGLAGES.uniteTarif}`)).toBeInTheDocument());
  });

  it('déplie puis replie un tour au second clic', async () => {
    vi.doMock('../../src/api/sessions', () => ({ recupereSession: vi.fn(async () => detailSession()) }));
    mockReglages();

    await monteEcran();
    await waitFor(() => expect(screen.getByRole('table')).toBeInTheDocument());

    const ligne = screen.getByRole('button', { name: /Lecture du brief/ });
    const utilisateur = userEvent.setup();
    await utilisateur.click(ligne);
    expect(ligne).toHaveAttribute('aria-expanded', 'true');
    await utilisateur.click(ligne);
    expect(ligne).toHaveAttribute('aria-expanded', 'false');
  });
});
