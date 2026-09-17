/**
 * Tests de l'écran Tableau de bord — les quatre états, la sélection d'une
 * barre qui filtre les projets sur la journée, la sélection d'un projet qui
 * change le panneau de droite, la bascule d'unité, et l'accessibilité de
 * base (titres, rôles, libellés, navigation clavier des lignes du tableau).
 *
 * Le client d'API est bouchonné via `vi.doMock` sur les modules `src/api/*`,
 * comme le fait déjà `tests/hooks.test.tsx` : aucun appel réseau réel.
 */
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { COMMUN, TABLEAU_DE_BORD } from '../../src/labels';
import type { LigneProjet, ModeleId, Resume } from '../../src/types/api';

function usage(valeur: number) {
  return { entree: valeur, sortie: valeur, cacheEcriture: valeur, cacheLecture: valeur };
}

const PAR_MODELE_JOUR_1: Readonly<Record<ModeleId, number>> = {
  'claude-opus-5': 41.8,
  'claude-sonnet-5': 14.1,
  'claude-haiku-4-5': 2.4,
};

const PAR_MODELE_JOUR_2: Readonly<Record<ModeleId, number>> = {
  'claude-opus-5': 26.3,
  'claude-sonnet-5': 8.9,
  'claude-haiku-4-5': 1.5,
};

const RESUME_PRET: Resume = {
  debut: '2026-09-01',
  fin: '2026-09-10',
  cout: 209.9,
  tokens: 209_900_000,
  sessions: 42,
  partCache: 82,
  economieCache: 950.4,
  projectionFinDeMois: 629.7,
  parJour: [
    { date: '2026-09-09', cout: 58.3, parModele: PAR_MODELE_JOUR_1 },
    { date: '2026-09-10', cout: 36.7, parModele: PAR_MODELE_JOUR_2 },
  ],
  parModele: [
    {
      modele: 'claude-opus-5',
      libelle: 'Opus 5',
      cout: 120.4,
      tokens: 58_100_000,
      usage: usage(1000),
      partCache: 70,
    },
    {
      modele: 'claude-sonnet-5',
      libelle: 'Sonnet 5',
      cout: 68.1,
      tokens: 33_400_000,
      usage: usage(500),
      partCache: 60,
    },
    {
      modele: 'claude-haiku-4-5',
      libelle: 'Haiku 4.5',
      cout: 21.4,
      tokens: 118_400_000,
      usage: usage(2000),
      partCache: 95,
    },
  ],
  deltaPeriodePrecedente: 18.4,
  plafondGlobal: 800,
  partPlafond: 78,
};

const RESUME_VIDE: Resume = {
  ...RESUME_PRET,
  cout: 0,
  tokens: 0,
  sessions: 0,
  parJour: [],
  parModele: [],
};

const PROJET_1: LigneProjet = {
  projet: 'gcmt-backend-simulation',
  cout: 112.4,
  tokens: 44_800_000,
  sessions: 14,
  parModele: { 'claude-opus-5': 64.2, 'claude-sonnet-5': 43.1, 'claude-haiku-4-5': 5.1 },
  part: 54,
  modeleDominant: 'claude-opus-5',
  postes: [
    { label: 'Edit / Write', cout: 38.6 },
    { label: 'Read', cout: 31.2 },
    { label: 'Bash + tests', cout: 22.4 },
  ],
  alerte: 'Budget Stellantis à 28 % au 10 du mois — rythme tenable.',
};

const PROJET_2: LigneProjet = {
  projet: 'enerflex-demo3',
  cout: 68.2,
  tokens: 27_100_000,
  sessions: 9,
  parModele: { 'claude-opus-5': 48.9, 'claude-sonnet-5': 16.8, 'claude-haiku-4-5': 2.5 },
  part: 33,
  modeleDominant: 'claude-sonnet-5',
  postes: [
    { label: 'Agents (7)', cout: 41.3 },
    { label: 'Read', cout: 14.9 },
    { label: 'Bash + tests', cout: 12.0 },
  ],
  alerte: 'Le workflow à 7 agents pèse 61 % du coût du projet.',
};

const PROJETS_PRET: readonly LigneProjet[] = [PROJET_1, PROJET_2];

interface Bouchons {
  readonly recupereResume: ReturnType<typeof vi.fn>;
  readonly recupereProjets: ReturnType<typeof vi.fn>;
  readonly recupereExportCsv: ReturnType<typeof vi.fn>;
}

function poseBouchons(overrides: Partial<Bouchons> = {}) {
  const recupereResume = overrides.recupereResume ?? vi.fn(async () => RESUME_PRET);
  const recupereProjets = overrides.recupereProjets ?? vi.fn(async () => [...PROJETS_PRET]);
  const recupereExportCsv = overrides.recupereExportCsv ?? vi.fn(async () => 'projet;cout\n');

  vi.doMock('../../src/api/resume', () => ({ recupereResume, recupereExportCsv }));
  vi.doMock('../../src/api/projets', () => ({ recupereProjets }));
  vi.doMock('../../src/api/sante', () => ({
    recupereSante: vi.fn(async () => ({
      statut: 'ok' as const,
      version: '1.0.0',
      source: 'exemple' as const,
      synchro: new Date().toISOString(),
      cycle: { debut: '2026-09-01', fin: '2026-09-30', jour: 10, jours: 30 },
    })),
  }));

  return { recupereResume, recupereProjets, recupereExportCsv };
}

async function rendEcran(overrides: Partial<Bouchons> = {}) {
  const bouchons = poseBouchons(overrides);
  const { default: TableauDeBord } = await import('../../src/ecrans/TableauDeBord');
  render(<TableauDeBord />);
  return bouchons;
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetModules();
});

describe('Tableau de bord — les quatre états', () => {
  it('affiche un état de chargement avant que le résumé arrive', async () => {
    let resoudre: ((valeur: Resume) => void) | undefined;
    await rendEcran({
      recupereResume: vi.fn(
        () =>
          new Promise<Resume>((resolve) => {
            resoudre = resolve;
          }),
      ),
    });

    expect(screen.getByText(COMMUN.etats.chargement)).toBeInTheDocument();
    resoudre?.(RESUME_PRET);
  });

  it('affiche les tuiles et le graphique une fois le résumé prêt', async () => {
    await rendEcran();

    expect(await screen.findByRole('heading', { level: 1, name: TABLEAU_DE_BORD.titre })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('209,90')).toBeInTheDocument());
    expect(screen.getByRole('heading', { level: 2, name: TABLEAU_DE_BORD.graphique.titreCout })).toBeInTheDocument();
  });

  it('affiche une phrase utile quand la période ne porte aucune session', async () => {
    await rendEcran({ recupereResume: vi.fn(async () => RESUME_VIDE), recupereProjets: vi.fn(async () => []) });

    expect(await screen.findByText(TABLEAU_DE_BORD.videTitre)).toBeInTheDocument();
    expect(screen.getByText(TABLEAU_DE_BORD.videDetail)).toBeInTheDocument();
  });

  it('affiche le message du backend et permet de réessayer en erreur', async () => {
    const recupereResume = vi.fn(async () => {
      throw new Error('Le service de résumé est momentanément indisponible.');
    });
    await rendEcran({ recupereResume });

    expect(await screen.findByText('Le service de résumé est momentanément indisponible.')).toBeInTheDocument();
    const bouton = screen.getByRole('button', { name: 'Réessayer' });
    await userEvent.click(bouton);
    await waitFor(() => expect(recupereResume).toHaveBeenCalledTimes(2));
  });
});

describe('Tableau de bord — sélection d’une barre', () => {
  it('filtre la liste des projets sur la journée cliquée, et permet d’annuler', async () => {
    const { recupereProjets } = await rendEcran();

    await screen.findByRole('heading', { level: 1, name: TABLEAU_DE_BORD.titre });
    const listeJours = await screen.findByRole('listbox', { name: TABLEAU_DE_BORD.graphique.titreCout });
    const barres = within(listeJours).getAllByRole('option');
    expect(barres.length).toBeGreaterThan(0);

    await userEvent.click(barres[0] as HTMLElement);

    await waitFor(() =>
      expect(recupereProjets).toHaveBeenCalledWith({ debut: '2026-09-09', fin: '2026-09-09' }, expect.any(Object)),
    );

    const boutonAnnuler = await screen.findByRole('button', { name: COMMUN.actions.annuler });
    expect(boutonAnnuler).toBeInTheDocument();

    await userEvent.click(boutonAnnuler);
    await waitFor(() =>
      expect(recupereProjets).toHaveBeenLastCalledWith({}, expect.any(Object)),
    );
  });
});

describe('Tableau de bord — sélection d’un projet', () => {
  it('change le panneau de droite quand on clique une autre ligne', async () => {
    await rendEcran();

    await waitFor(() => expect(screen.getByText(PROJET_1.alerte)).toBeInTheDocument());

    const ligne = screen.getByRole('button', { name: new RegExp(PROJET_2.projet) });
    await userEvent.click(ligne);

    await waitFor(() => expect(screen.getByText(PROJET_2.alerte)).toBeInTheDocument());
  });

  it('se pilote au clavier (Entrée sélectionne la ligne)', async () => {
    await rendEcran();

    const ligne = await screen.findByRole('button', { name: new RegExp(PROJET_2.projet) });
    ligne.focus();
    fireEvent.keyDown(ligne, { key: 'Enter' });

    await waitFor(() => expect(screen.getByText(PROJET_2.alerte)).toBeInTheDocument());
  });
});

describe('Tableau de bord — bascule d’unité', () => {
  it('change le titre du graphique entre coût et tokens', async () => {
    await rendEcran();

    expect(
      await screen.findByRole('heading', { level: 2, name: TABLEAU_DE_BORD.graphique.titreCout }),
    ).toBeInTheDocument();

    const groupeUnite = screen.getByRole('radiogroup', { name: 'Unité' });
    const optionTokens = within(groupeUnite).getByRole('radio', { name: TABLEAU_DE_BORD.segmentUnites.tokens });
    await userEvent.click(optionTokens);

    expect(
      screen.getByRole('heading', { level: 2, name: TABLEAU_DE_BORD.graphique.titreTokens }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { level: 2, name: TABLEAU_DE_BORD.graphique.titreCout }),
    ).not.toBeInTheDocument();
  });
});

describe('Tableau de bord — sélection de période', () => {
  it('recalcule les bornes sur la dernière journée de données quand on choisit « 7 j »', async () => {
    const { recupereResume } = await rendEcran();
    await waitFor(() => expect(screen.getByText('209,90')).toBeInTheDocument());

    const groupePeriode = screen.getByRole('radiogroup', { name: 'Période' });
    const option7j = within(groupePeriode).getByRole('radio', { name: TABLEAU_DE_BORD.segmentPeriodes['7j'] });
    await userEvent.click(option7j);

    await waitFor(() =>
      expect(recupereResume).toHaveBeenLastCalledWith(
        { debut: '2026-09-04', fin: '2026-09-10' },
        expect.any(Object),
      ),
    );
  });

  it('recalcule les bornes du trimestre en cours quand on choisit « TRIM. »', async () => {
    const { recupereResume } = await rendEcran();
    await waitFor(() => expect(screen.getByText('209,90')).toBeInTheDocument());

    const groupePeriode = screen.getByRole('radiogroup', { name: 'Période' });
    const optionTrimestre = within(groupePeriode).getByRole('radio', {
      name: TABLEAU_DE_BORD.segmentPeriodes.trimestre,
    });
    await userEvent.click(optionTrimestre);

    await waitFor(() =>
      expect(recupereResume).toHaveBeenLastCalledWith(
        { debut: '2026-07-01', fin: '2026-09-30' },
        expect.any(Object),
      ),
    );
  });
});

describe('Tableau de bord — export CSV', () => {
  it('appelle /api/export.csv avec la période courante', async () => {
    const objectUrlOriginal = URL.createObjectURL;
    const revokeOriginal = URL.revokeObjectURL;
    URL.createObjectURL = vi.fn(() => 'blob:tokenometre');
    URL.revokeObjectURL = vi.fn();

    const { recupereExportCsv } = await rendEcran();
    await screen.findByRole('heading', { level: 1, name: TABLEAU_DE_BORD.titre });

    const bouton = screen.getByRole('button', { name: new RegExp(COMMUN.actions.exporterCsv) });
    await userEvent.click(bouton);

    await waitFor(() => expect(recupereExportCsv).toHaveBeenCalledWith({}));

    URL.createObjectURL = objectUrlOriginal;
    URL.revokeObjectURL = revokeOriginal;
  });
});

describe('Tableau de bord — accessibilité', () => {
  it('porte un titre de niveau 1 et des groupes de contrôles nommés', async () => {
    await rendEcran();

    await screen.findByRole('heading', { level: 1, name: TABLEAU_DE_BORD.titre });
    expect(screen.getByRole('radiogroup', { name: 'Période' })).toBeInTheDocument();
    expect(screen.getByRole('radiogroup', { name: 'Unité' })).toBeInTheDocument();
    expect(screen.getByRole('table')).toBeInTheDocument();
  });
});
