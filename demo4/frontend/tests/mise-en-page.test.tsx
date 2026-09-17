import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Ecran } from '../src/components/mise-en-page/Ecran';
import { EnTeteEcran } from '../src/components/mise-en-page/EnTeteEcran';
import { COMMUN } from '../src/labels';

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetModules();
});

describe('Ecran', () => {
  it('rend ses enfants', () => {
    render(
      <Ecran>
        <p>Contenu de l’écran</p>
      </Ecran>,
    );
    expect(screen.getByText('Contenu de l’écran')).toBeInTheDocument();
  });
});

describe('EnTeteEcran', () => {
  it('affiche le micro-label, le titre et les actions', () => {
    render(<EnTeteEcran microLabel="Septembre 2026" titre="Tableau de bord" actions={<button>Exporter CSV</button>} />);

    expect(screen.getByText('Septembre 2026')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Tableau de bord' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Exporter CSV' })).toBeInTheDocument();
  });

  it("ne rend aucune zone d'actions quand elle n'est pas fournie", () => {
    const { container } = render(<EnTeteEcran microLabel="Cycle" titre="Réglages" />);
    expect(container.querySelectorAll('button')).toHaveLength(0);
  });
});

describe('PiedDePage', () => {
  it("affiche la mention des tarifs et « données d'exemple » quand la source est l'exemple", async () => {
    vi.doMock('../src/api/sante', () => ({
      recupereSante: vi.fn(async () => ({
        statut: 'ok' as const,
        version: '1.0.0',
        source: 'exemple' as const,
        synchro: new Date().toISOString(),
        cycle: { debut: '2026-09-01', fin: '2026-09-30', jour: 10, jours: 30 },
      })),
    }));
    const { PiedDePage: PiedDePageIsole } = await import('../src/components/mise-en-page/PiedDePage');

    render(<PiedDePageIsole />);

    expect(screen.getByText(COMMUN.piedDePage.mentionTarifs)).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText(COMMUN.piedDePage.sourceExemple)).toBeInTheDocument());
  });

  it('affiche « transcripts réels » quand la source est les transcripts', async () => {
    vi.doMock('../src/api/sante', () => ({
      recupereSante: vi.fn(async () => ({
        statut: 'ok' as const,
        version: '1.0.0',
        source: 'transcripts' as const,
        synchro: new Date().toISOString(),
        cycle: { debut: '2026-09-01', fin: '2026-09-30', jour: 10, jours: 30 },
      })),
    }));
    const { PiedDePage: PiedDePageIsole } = await import('../src/components/mise-en-page/PiedDePage');

    render(<PiedDePageIsole />);

    await waitFor(() => expect(screen.getByText(COMMUN.piedDePage.sourceTranscripts)).toBeInTheDocument());
  });

  it('accepte une mention personnalisée', async () => {
    vi.doMock('../src/api/sante', () => ({
      recupereSante: vi.fn(async () => ({
        statut: 'ok' as const,
        version: '1.0.0',
        source: 'exemple' as const,
        synchro: new Date().toISOString(),
        cycle: { debut: '2026-09-01', fin: '2026-09-30', jour: 10, jours: 30 },
      })),
    }));
    const { PiedDePage: PiedDePageIsole } = await import('../src/components/mise-en-page/PiedDePage');

    render(<PiedDePageIsole mention="Projection = rythme des 10 premiers jours extrapolé sur le cycle." />);

    expect(
      screen.getByText('Projection = rythme des 10 premiers jours extrapolé sur le cycle.'),
    ).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText(COMMUN.piedDePage.sourceExemple)).toBeInTheDocument());
  });
});

describe('BarreLaterale', () => {
  it('affiche les cinq destinations, marque la destination active et le bloc de synchro', async () => {
    const ilYA5min = new Date(Date.now() - 5 * 60_000).toISOString();
    vi.doMock('../src/api/sante', () => ({
      recupereSante: vi.fn(async () => ({
        statut: 'ok' as const,
        version: '1.0.0',
        source: 'exemple' as const,
        synchro: ilYA5min,
        cycle: { debut: '2026-09-01', fin: '2026-09-30', jour: 10, jours: 30 },
      })),
    }));
    const { BarreLaterale } = await import('../src/components/mise-en-page/BarreLaterale');

    render(
      <MemoryRouter initialEntries={['/budgets']}>
        <BarreLaterale />
      </MemoryRouter>,
    );

    for (const label of Object.values(COMMUN.navigation)) {
      expect(screen.getByRole('link', { name: new RegExp(label) })).toBeInTheDocument();
    }

    const lienActif = screen.getByRole('link', { name: new RegExp(COMMUN.navigation.budgets) });
    expect(lienActif).toHaveAttribute('aria-current', 'page');

    await waitFor(() =>
      expect(screen.getByText(`${COMMUN.barreLaterale.synchroPrefixe} 5 ${COMMUN.barreLaterale.synchroSuffixe}`)).toBeInTheDocument(),
    );
  });
});
