/**
 * Tests de l'écran « Modèles & agents » : les quatre états, le changement de
 * période, le rendu des tarifs (venus de `/api/reglages`, jamais d'une
 * constante) et l'accessibilité des deux tableaux.
 */
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { COMMUN, MODELES_ET_AGENTS, REGLAGES } from '../../src/labels';
import { calculeBornes } from '../../src/ecrans/ModelesEtAgents/periode';
import type { Reglages, Resume } from '../../src/types/api';
import type { ReponseAgents } from '../../src/api/agents';

const SANTE_OK = {
  statut: 'ok' as const,
  version: '1.0.0',
  source: 'exemple' as const,
  synchro: new Date().toISOString(),
  cycle: { debut: '2026-09-01', fin: '2026-09-30', jour: 10, jours: 30 },
};

const REGLAGES_OK: Reglages = {
  source: 'exemple',
  chemin: "jeu d'exemple",
  cycle: { debut: '2026-09-01', fin: '2026-09-30', jour: 10, jours: 30 },
  devise: 'USD',
  modeles: [
    {
      modele: 'claude-opus-5',
      libelle: 'Opus 5',
      tarif: { libelle: 'Opus 5', entree: 5, sortie: 25, cacheEcriture: 6.25, cacheLecture: 0.5 },
    },
    {
      modele: 'claude-sonnet-5',
      libelle: 'Sonnet 5',
      tarif: { libelle: 'Sonnet 5', entree: 2, sortie: 10, cacheEcriture: 2.5, cacheLecture: 0.2 },
    },
    {
      modele: 'claude-haiku-4-5',
      libelle: 'Haiku 4.5',
      tarif: { libelle: 'Haiku 4.5', entree: 1, sortie: 5, cacheEcriture: 1.25, cacheLecture: 0.1 },
    },
  ],
};

const RESUME_PRET: Resume = {
  debut: '2026-09-01',
  fin: '2026-09-10',
  cout: 300.5,
  tokens: 120_000_000,
  sessions: 12,
  partCache: 62,
  economieCache: 400,
  projectionFinDeMois: 900,
  parJour: [],
  parModele: [
    {
      modele: 'claude-opus-5',
      libelle: 'Opus 5',
      cout: 180.2,
      tokens: 60_000_000,
      usage: { entree: 3_200_000, sortie: 6_800_000, cacheEcriture: 2_400_000, cacheLecture: 45_200_000 },
      partCache: 75,
    },
    {
      modele: 'claude-sonnet-5',
      libelle: 'Sonnet 5',
      cout: 90.1,
      tokens: 45_000_000,
      usage: { entree: 5_400_000, sortie: 5_100_000, cacheEcriture: 3_200_000, cacheLecture: 42_000_000 },
      partCache: 70,
    },
    {
      modele: 'claude-haiku-4-5',
      libelle: 'Haiku 4.5',
      cout: 30.2,
      tokens: 15_000_000,
      usage: { entree: 3_000_000, sortie: 1_500_000, cacheEcriture: 800_000, cacheLecture: 7_000_000 },
      partCache: 46,
    },
  ],
  deltaPeriodePrecedente: 12.4,
  plafondGlobal: 1000,
  partPlafond: 30,
};

const RESUME_VIDE: Resume = {
  ...RESUME_PRET,
  cout: 0,
  tokens: 0,
  sessions: 0,
  parModele: [],
};

const AGENTS_PRET: ReponseAgents = {
  agents: [
    {
      agent: 'react-dev',
      cout: 120.4,
      appels: 42,
      parModele: { 'claude-opus-5': 70.2, 'claude-sonnet-5': 40.1, 'claude-haiku-4-5': 10.1 },
      economieSiSonnet: 55.3,
    },
    {
      agent: 'node-dev',
      cout: 60.2,
      appels: 28,
      parModele: { 'claude-opus-5': 10.2, 'claude-sonnet-5': 40, 'claude-haiku-4-5': 10 },
      economieSiSonnet: 8.1,
    },
  ],
  outils: [
    { outil: 'Edit', cout: 80, appels: 30 },
    { outil: 'Read', cout: 40, appels: 20 },
  ],
};

const AGENTS_VIDE: ReponseAgents = { agents: [], outils: [] };

interface Mocks {
  readonly recupereResume: ReturnType<typeof vi.fn>;
  readonly recupereAgents: ReturnType<typeof vi.fn>;
  readonly recupereReglages: ReturnType<typeof vi.fn>;
  readonly recupereSante: ReturnType<typeof vi.fn>;
}

function poseMocks(overrides: Partial<Mocks> = {}) {
  const recupereResume = overrides.recupereResume ?? vi.fn(async () => RESUME_PRET);
  const recupereAgents = overrides.recupereAgents ?? vi.fn(async () => AGENTS_PRET);
  const recupereReglages = overrides.recupereReglages ?? vi.fn(async () => REGLAGES_OK);
  const recupereSante = overrides.recupereSante ?? vi.fn(async () => SANTE_OK);

  vi.doMock('../../src/api/resume', () => ({ recupereResume }));
  vi.doMock('../../src/api/agents', () => ({ recupereAgents }));
  vi.doMock('../../src/api/reglages', () => ({ recupereReglages }));
  vi.doMock('../../src/api/sante', () => ({ recupereSante }));

  return { recupereResume, recupereAgents, recupereReglages, recupereSante };
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetModules();
});

describe('ModelesEtAgents — états', () => {
  it('affiche le chargement tant que les ressources ne sont pas résolues', async () => {
    poseMocks({
      recupereResume: vi.fn(() => new Promise<Resume>(() => {})),
      recupereAgents: vi.fn(() => new Promise<ReponseAgents>(() => {})),
      recupereReglages: vi.fn(() => new Promise<Reglages>(() => {})),
      recupereSante: vi.fn(() => new Promise(() => {})),
    });
    const { default: ModelesEtAgents } = await import('../../src/ecrans/ModelesEtAgents');

    render(<ModelesEtAgents />);

    expect(screen.getByRole('status')).toHaveTextContent(COMMUN.etats.chargement);
  });

  it("affiche le message d'erreur du backend et permet de réessayer", async () => {
    const messageBackend = 'Le paramètre fin est antérieur au paramètre debut.';
    const recupereResume = vi.fn().mockRejectedValue(new Error(messageBackend));
    poseMocks({ recupereResume });
    const { default: ModelesEtAgents } = await import('../../src/ecrans/ModelesEtAgents');

    render(<ModelesEtAgents />);

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(messageBackend));

    const utilisateur = userEvent.setup();
    await utilisateur.click(screen.getByRole('button', { name: 'Réessayer' }));
    expect(recupereResume).toHaveBeenCalledTimes(2);
  });

  it("affiche l'état vide quand il n'y a aucune activité sur la période", async () => {
    poseMocks({
      recupereResume: vi.fn(async () => RESUME_VIDE),
      recupereAgents: vi.fn(async () => AGENTS_VIDE),
    });
    const { default: ModelesEtAgents } = await import('../../src/ecrans/ModelesEtAgents');

    render(<ModelesEtAgents />);

    await waitFor(() => expect(screen.getByText(MODELES_ET_AGENTS.videTitre)).toBeInTheDocument());
  });

  it('affiche les panneaux de modèle, les deux tableaux et la mention de recalcul une fois prêt', async () => {
    poseMocks();
    const { default: ModelesEtAgents } = await import('../../src/ecrans/ModelesEtAgents');

    render(<ModelesEtAgents />);

    await waitFor(() => expect(screen.getAllByText('Opus 5').length).toBeGreaterThan(0));
    expect(screen.getAllByText('Sonnet 5').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Haiku 4.5').length).toBeGreaterThan(0);
    expect(screen.getByText(MODELES_ET_AGENTS.mentionRecalcul)).toBeInTheDocument();
  });
});

describe('ModelesEtAgents — tarifs affichés', () => {
  it('affiche pour chaque poste le tarif $/M renvoyé par /api/reglages, pas une constante locale', async () => {
    poseMocks();
    const { default: ModelesEtAgents } = await import('../../src/ecrans/ModelesEtAgents');

    render(<ModelesEtAgents />);

    // Tarif d'écriture cache d'Opus 5 (6,25 $/M dans REGLAGES_OK) : rendu tel quel, jamais recalculé.
    await waitFor(() => expect(screen.getByText(`6,25 ${REGLAGES.uniteTarif}`)).toBeInTheDocument());
    // Tarif de lecture cache de Sonnet 5 (0,2 $/M).
    expect(screen.getByText(`0,20 ${REGLAGES.uniteTarif}`)).toBeInTheDocument();
  });
});

describe('ModelesEtAgents — période', () => {
  it('recharge le résumé et les agents avec les bornes de la période choisie', async () => {
    const { recupereResume, recupereAgents } = poseMocks();
    const { default: ModelesEtAgents } = await import('../../src/ecrans/ModelesEtAgents');

    render(<ModelesEtAgents />);
    await waitFor(() => expect(screen.getByText('react-dev')).toBeInTheDocument());

    // Par défaut : le cycle en cours, donc aucune borne envoyée.
    expect(recupereResume).toHaveBeenLastCalledWith({ debut: undefined, fin: undefined }, expect.anything());

    const utilisateur = userEvent.setup();
    await utilisateur.click(screen.getByRole('radio', { name: '7 J' }));

    const bornesAttendues = calculeBornes('7j');
    await waitFor(() =>
      expect(recupereResume).toHaveBeenLastCalledWith(
        { debut: bornesAttendues.debut, fin: bornesAttendues.fin },
        expect.anything(),
      ),
    );
    expect(recupereAgents).toHaveBeenLastCalledWith(
      { debut: bornesAttendues.debut, fin: bornesAttendues.fin },
      expect.anything(),
    );
  });
});

describe('ModelesEtAgents — accessibilité des tableaux', () => {
  it('expose « Par agent » et « Par outil » comme des tableaux avec en-têtes de colonne', async () => {
    poseMocks();
    const { default: ModelesEtAgents } = await import('../../src/ecrans/ModelesEtAgents');

    render(<ModelesEtAgents />);
    await waitFor(() => expect(screen.getByText('react-dev')).toBeInTheDocument());

    const tables = screen.getAllByRole('table');
    expect(tables).toHaveLength(2);

    const [tableauAgents, tableauOutils] = tables;
    if (!tableauAgents || !tableauOutils) {
      throw new Error('Les deux tableaux attendus sont introuvables.');
    }
    expect(within(tableauAgents).getByRole('columnheader', { name: MODELES_ET_AGENTS.colonneAgent })).toBeInTheDocument();
    expect(
      within(tableauAgents).getByRole('columnheader', { name: 'Économie Sonnet 5 $' }),
    ).toBeInTheDocument();
    expect(within(tableauAgents).getAllByRole('row').length).toBeGreaterThan(0);

    expect(within(tableauOutils).getByRole('columnheader', { name: MODELES_ET_AGENTS.colonneOutil })).toBeInTheDocument();
    expect(within(tableauOutils).getByRole('columnheader', { name: 'Part' })).toBeInTheDocument();
  });
});
