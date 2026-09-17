/**
 * Tests de l'écran « Réglages » : les quatre états, le rendu des tarifs tels
 * que renvoyés par `/api/reglages`, et l'accessibilité du tableau des tarifs.
 */
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { COMMUN, REGLAGES } from '../../src/labels';
import type { Reglages, Sante } from '../../src/types/api';

const SANTE_OK: Sante = {
  statut: 'ok',
  version: '1.0.0',
  source: 'exemple',
  synchro: '2026-09-10T08:15:00.000Z',
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

const REGLAGES_TRANSCRIPTS: Reglages = { ...REGLAGES_OK, source: 'transcripts', chemin: '/var/donnees/transcripts' };

interface Mocks {
  readonly recupereReglages: ReturnType<typeof vi.fn>;
  readonly recupereSante: ReturnType<typeof vi.fn>;
}

function poseMocks(overrides: Partial<Mocks> = {}) {
  const recupereReglages = overrides.recupereReglages ?? vi.fn(async () => REGLAGES_OK);
  const recupereSante = overrides.recupereSante ?? vi.fn(async () => SANTE_OK);

  vi.doMock('../../src/api/reglages', () => ({ recupereReglages }));
  vi.doMock('../../src/api/sante', () => ({ recupereSante }));

  return { recupereReglages, recupereSante };
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetModules();
});

describe('Reglages — états', () => {
  it('affiche le chargement tant que les réglages ne sont pas résolus', async () => {
    poseMocks({
      recupereReglages: vi.fn(() => new Promise<Reglages>(() => {})),
      recupereSante: vi.fn(() => new Promise(() => {})),
    });
    const { default: Reglages } = await import('../../src/ecrans/Reglages');

    render(<Reglages />);

    expect(screen.getByRole('status')).toHaveTextContent(COMMUN.etats.chargement);
  });

  it("affiche le message d'erreur du backend et permet de réessayer", async () => {
    const messageBackend = 'Réglages indisponibles pour le moment.';
    const recupereReglages = vi.fn().mockRejectedValue(new Error(messageBackend));
    poseMocks({ recupereReglages });
    const { default: Reglages } = await import('../../src/ecrans/Reglages');

    render(<Reglages />);

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(messageBackend));

    const utilisateur = userEvent.setup();
    await utilisateur.click(screen.getByRole('button', { name: 'Réessayer' }));
    expect(recupereReglages).toHaveBeenCalledTimes(2);
  });

  it("affiche l'état vide quand aucun tarif de modèle n'est renvoyé", async () => {
    poseMocks({ recupereReglages: vi.fn(async () => ({ ...REGLAGES_OK, modeles: [] })) });
    const { default: Reglages } = await import('../../src/ecrans/Reglages');

    render(<Reglages />);

    await waitFor(() => expect(screen.getByText(REGLAGES.videTitre)).toBeInTheDocument());
  });

  it('affiche les trois panneaux une fois prêt', async () => {
    poseMocks();
    const { default: Reglages } = await import('../../src/ecrans/Reglages');

    render(<Reglages />);

    await waitFor(() => expect(screen.getByText(REGLAGES.sectionSource)).toBeInTheDocument());
    expect(screen.getByText(REGLAGES.sectionCycle)).toBeInTheDocument();
    expect(screen.getByText(REGLAGES.sectionTarifs)).toBeInTheDocument();
  });
});

describe('Reglages — source des données', () => {
  it("affiche le libellé « jeu d'exemple », le chemin et comment basculer vers les transcripts", async () => {
    poseMocks();
    const { default: Reglages } = await import('../../src/ecrans/Reglages');

    render(<Reglages />);

    await waitFor(() => expect(screen.getByText(REGLAGES.sourceExempleLabel)).toBeInTheDocument());
    expect(screen.getByText("jeu d'exemple")).toBeInTheDocument();
    expect(screen.getByText(/TOKENOMETRE_TRANSCRIPTS/)).toBeInTheDocument();
  });

  it('affiche « transcripts réels » et le chemin renvoyé quand la source est les transcripts', async () => {
    poseMocks({ recupereReglages: vi.fn(async () => REGLAGES_TRANSCRIPTS) });
    const { default: Reglages } = await import('../../src/ecrans/Reglages');

    render(<Reglages />);

    await waitFor(() => expect(screen.getByText(REGLAGES.sourceTranscriptsLabel)).toBeInTheDocument());
    expect(screen.getByText('/var/donnees/transcripts')).toBeInTheDocument();
  });
});

describe('Reglages — cycle de facturation', () => {
  it('affiche la progression du cycle avec une jauge neutre', async () => {
    poseMocks();
    const { default: Reglages } = await import('../../src/ecrans/Reglages');

    render(<Reglages />);

    await waitFor(() => expect(screen.getByText(COMMUN.barreLaterale.jourDe(10, 30))).toBeInTheDocument());
    const jauge = screen.getByRole('progressbar');
    expect(jauge).toHaveAttribute('aria-valuenow', '33');
  });
});

describe('Reglages — tarifs affichés', () => {
  it('affiche le tableau des tarifs tel que renvoyé par /api/reglages, en lecture seule', async () => {
    poseMocks();
    const { default: Reglages } = await import('../../src/ecrans/Reglages');

    render(<Reglages />);

    await waitFor(() => expect(screen.getByText('Opus 5')).toBeInTheDocument());

    const tableau = screen.getByRole('table');
    expect(within(tableau).getByRole('columnheader', { name: REGLAGES.colonneModele })).toBeInTheDocument();
    expect(within(tableau).getByRole('columnheader', { name: REGLAGES.colonneEntree })).toBeInTheDocument();
    expect(within(tableau).getByRole('columnheader', { name: REGLAGES.colonneCacheLecture })).toBeInTheDocument();

    // Tarif de sortie d'Opus 5 (25 $/M) : affiché tel quel, jamais recalculé.
    expect(within(tableau).getByText('25,00')).toBeInTheDocument();

    // Aucun contrôle d'édition sur un écran en lecture seule.
    expect(screen.queryByRole('button', { name: /enregistrer/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('slider')).not.toBeInTheDocument();

    expect(screen.getByText(/seule source de vérité des coûts/)).toBeInTheDocument();
  });
});
