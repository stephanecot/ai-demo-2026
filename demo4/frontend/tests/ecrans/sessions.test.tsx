/**
 * Écran Sessions (liste) : les quatre états, le filtre par projet, le tri
 * (confié à l'API, plus récentes d'abord) et la navigation vers le détail
 * au clic comme au clavier.
 */
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { SESSIONS } from '../../src/labels';
import type { LigneProjet, ResumeSession } from '../../src/types/api';

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetModules();
});

function session(partiel: Partial<ResumeSession> & Pick<ResumeSession, 'id'>): ResumeSession {
  return {
    projet: 'ai-demo-2026/demo4',
    branche: 'feat/import-jsonl',
    debut: '2026-09-09T14:02:00.000Z',
    fin: '2026-09-09T16:41:00.000Z',
    tours: 14,
    cout: 27.543,
    tokens: 182_400_000,
    partCache: 42,
    ...partiel,
  };
}

function projet(nom: string): LigneProjet {
  return {
    projet: nom,
    cout: 100,
    tokens: 1_000_000,
    sessions: 3,
    parModele: {
      'claude-opus-5': 100,
      'claude-sonnet-5': 0,
      'claude-haiku-4-5': 0,
    },
    part: 100,
    modeleDominant: 'claude-opus-5',
    postes: [],
    alerte: 'Rien à signaler.',
  };
}

async function monteEcran() {
  const module = await import('../../src/ecrans/Sessions');
  const Sessions = module.default;
  render(
    <MemoryRouter initialEntries={['/sessions']}>
      <Routes>
        <Route path="/sessions" element={<Sessions />} />
        <Route path="/sessions/:id" element={<p>Détail de la session</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('écran Sessions', () => {
  it('affiche le chargement puis la liste triée par date décroissante fournie par l’API', async () => {
    const recupereSessions = vi.fn(async () => [session({ id: '4f2c9a1e' }), session({ id: '9a11ffcc' })]);
    vi.doMock('../../src/api/sessions', () => ({ recupereSessions }));
    vi.doMock('../../src/api/projets', () => ({ recupereProjets: vi.fn(async () => [projet('ai-demo-2026/demo4')]) }));

    await monteEcran();

    expect(screen.getByRole('status')).toBeInTheDocument();

    await waitFor(() => expect(screen.getByRole('table')).toBeInTheDocument());
    const lignes = screen.getAllByRole('button', { name: /4f2c9a1e|9a11ffcc/ });
    expect(lignes).toHaveLength(2);
    expect(within(lignes[0] as HTMLElement).getByText('4f2c9a1e')).toBeInTheDocument();
  });

  it('affiche l’état vide avec une phrase utile quand la période n’a aucune session', async () => {
    vi.doMock('../../src/api/sessions', () => ({ recupereSessions: vi.fn(async () => []) }));
    vi.doMock('../../src/api/projets', () => ({ recupereProjets: vi.fn(async () => []) }));

    await monteEcran();

    await waitFor(() => expect(screen.getByText(SESSIONS.videTitre)).toBeInTheDocument());
    expect(screen.getByText(SESSIONS.videDetail)).toBeInTheDocument();
  });

  it('affiche le message d’erreur du backend et permet de réessayer', async () => {
    const recupereSessions = vi.fn(async () => {
      throw new Error('La période demandée est invalide.');
    });
    vi.doMock('../../src/api/sessions', () => ({ recupereSessions }));
    vi.doMock('../../src/api/projets', () => ({ recupereProjets: vi.fn(async () => []) }));

    await monteEcran();

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('La période demandée est invalide.'));

    const utilisateur = userEvent.setup();
    await utilisateur.click(screen.getByRole('button', { name: /réessayer/i }));
    await waitFor(() => expect(recupereSessions).toHaveBeenCalledTimes(2));
  });

  it('navigue vers le détail au clic sur une ligne', async () => {
    vi.doMock('../../src/api/sessions', () => ({
      recupereSessions: vi.fn(async () => [session({ id: '4f2c9a1e' })]),
    }));
    vi.doMock('../../src/api/projets', () => ({ recupereProjets: vi.fn(async () => []) }));

    await monteEcran();
    await waitFor(() => expect(screen.getByRole('table')).toBeInTheDocument());

    const utilisateur = userEvent.setup();
    await utilisateur.click(screen.getByRole('button', { name: /4f2c9a1e/ }));

    expect(await screen.findByText('Détail de la session')).toBeInTheDocument();
  });

  it('navigue vers le détail au clavier (Entrée)', async () => {
    vi.doMock('../../src/api/sessions', () => ({
      recupereSessions: vi.fn(async () => [session({ id: '4f2c9a1e' })]),
    }));
    vi.doMock('../../src/api/projets', () => ({ recupereProjets: vi.fn(async () => []) }));

    await monteEcran();
    await waitFor(() => expect(screen.getByRole('table')).toBeInTheDocument());

    const ligne = screen.getByRole('button', { name: /4f2c9a1e/ });
    ligne.focus();
    const utilisateur = userEvent.setup();
    await utilisateur.keyboard('{Enter}');

    expect(await screen.findByText('Détail de la session')).toBeInTheDocument();
  });

  it('transmet le projet choisi au filtre de l’API', async () => {
    const recupereSessions = vi.fn(async () => [session({ id: '4f2c9a1e' })]);
    vi.doMock('../../src/api/sessions', () => ({ recupereSessions }));
    vi.doMock('../../src/api/projets', () => ({
      recupereProjets: vi.fn(async () => [projet('synapse'), projet('gcmt')]),
    }));

    await monteEcran();
    await waitFor(() => expect(screen.getByRole('table')).toBeInTheDocument());

    const utilisateur = userEvent.setup();
    const filtre = await screen.findByRole('combobox', { name: SESSIONS.filtreProjetLabel });
    await utilisateur.selectOptions(filtre, 'synapse');

    await waitFor(() =>
      expect(recupereSessions).toHaveBeenLastCalledWith(
        expect.objectContaining({ projet: 'synapse' }),
        expect.any(Object),
      ),
    );
  });

  it('change de période au clic sur le segment « 30 j »', async () => {
    const recupereSessions = vi.fn(async () => []);
    vi.doMock('../../src/api/sessions', () => ({ recupereSessions }));
    vi.doMock('../../src/api/projets', () => ({ recupereProjets: vi.fn(async () => []) }));

    await monteEcran();
    await waitFor(() => expect(recupereSessions).toHaveBeenCalledTimes(1));

    const utilisateur = userEvent.setup();
    await utilisateur.click(screen.getByRole('radio', { name: /30/ }));

    await waitFor(() => expect(recupereSessions).toHaveBeenCalledTimes(2));
  });
});
