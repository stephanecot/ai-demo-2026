import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useRessource } from '../src/hooks/useRessource';

describe('useRessource', () => {
  it("démarre en chargement puis passe à prêt avec la donnée chargée", async () => {
    const chargeur = vi.fn(async () => ({ valeur: 42 }));
    const { result } = renderHook(() => useRessource(chargeur, []));

    expect(result.current.statut).toBe('chargement');
    expect(result.current.data).toBeUndefined();

    await waitFor(() => expect(result.current.statut).toBe('pret'));
    expect(result.current.data).toEqual({ valeur: 42 });
    expect(result.current.erreur).toBeUndefined();
  });

  it("passe à vide quand le prédicat `estVide` le décide", async () => {
    const chargeur = vi.fn(async () => [] as readonly number[]);
    const { result } = renderHook(() =>
      useRessource(chargeur, [], { estVide: (liste) => liste.length === 0 }),
    );

    await waitFor(() => expect(result.current.statut).toBe('vide'));
  });

  it("passe à erreur en portant le message du rejet, jamais un texte générique", async () => {
    const chargeur = vi.fn(async () => {
      throw new Error('Le budget « synapse » est introuvable.');
    });
    const { result } = renderHook(() => useRessource(chargeur, []));

    await waitFor(() => expect(result.current.statut).toBe('erreur'));
    expect(result.current.erreur).toBe('Le budget « synapse » est introuvable.');
    expect(result.current.data).toBeUndefined();
  });

  it('recharger relance le chargement même sans changement de dépendance', async () => {
    const chargeur = vi.fn(async () => Date.now());
    const { result } = renderHook(() => useRessource(chargeur, []));

    await waitFor(() => expect(result.current.statut).toBe('pret'));
    expect(chargeur).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.recharger();
    });

    await waitFor(() => expect(chargeur).toHaveBeenCalledTimes(2));
  });

  it('relance le chargement quand une dépendance change et annule la requête obsolète', async () => {
    const signauxRecus: AbortSignal[] = [];
    const chargeur = vi.fn((signal: AbortSignal) => {
      signauxRecus.push(signal);
      return new Promise<number>((resolve) => {
        setTimeout(() => resolve(1), 20);
      });
    });

    const { rerender } = renderHook(({ id }: { id: string }) => useRessource(chargeur, [id]), {
      initialProps: { id: 'a' },
    });

    rerender({ id: 'b' });

    await waitFor(() => expect(chargeur).toHaveBeenCalledTimes(2));
    expect(signauxRecus[0]?.aborted).toBe(true);
    expect(signauxRecus[1]?.aborted).toBe(false);
  });

  it("ne met pas à jour l'état après le démontage du composant", async () => {
    let resoudre: ((valeur: number) => void) | undefined;
    const chargeur = vi.fn(
      () =>
        new Promise<number>((resolve) => {
          resoudre = resolve;
        }),
    );

    const { result, unmount } = renderHook(() => useRessource(chargeur, []));
    expect(result.current.statut).toBe('chargement');

    unmount();

    // Résout la promesse après le démontage : si le hook mettait encore à
    // jour son état, React lèverait un avertissement ; ce test s'assure
    // surtout qu'aucune exception n'est levée ici.
    await act(async () => {
      resoudre?.(1);
      await Promise.resolve();
    });
  });
});

describe('hooks de ressource', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it('useSante ne connaît jamais l’état vide', async () => {
    vi.doMock('../src/api/sante', () => ({
      recupereSante: vi.fn(async () => ({
        statut: 'ok' as const,
        version: '1.0.0',
        source: 'exemple' as const,
        synchro: new Date().toISOString(),
        cycle: { debut: '2026-09-01', fin: '2026-09-30', jour: 10, jours: 30 },
      })),
    }));
    const module = await import('../src/hooks/useSante');
    const { result } = renderHook(() => module.useSante());
    await waitFor(() => expect(result.current.statut).toBe('pret'));
  });

  it('useProjets passe à vide quand la liste de projets est vide', async () => {
    vi.doMock('../src/api/projets', () => ({
      recupereProjets: vi.fn(async () => []),
    }));
    const module = await import('../src/hooks/useProjets');
    const { result } = renderHook(() => module.useProjets({ debut: '2026-09-01', fin: '2026-09-10' }));
    await waitFor(() => expect(result.current.statut).toBe('vide'));
  });

  it('useSessions transmet le filtre à l’appel API', async () => {
    const recupereSessions = vi.fn(async () => []);
    vi.doMock('../src/api/sessions', () => ({ recupereSessions }));
    const module = await import('../src/hooks/useSessions');
    renderHook(() => module.useSessions({ projet: 'gcmt' }));
    await waitFor(() => expect(recupereSessions).toHaveBeenCalledWith({ projet: 'gcmt' }, expect.any(Object)));
  });

  it('useAgents passe à prêt avec des listes non vides', async () => {
    vi.doMock('../src/api/agents', () => ({
      recupereAgents: vi.fn(async () => ({ agents: [{ agent: 'main' }], outils: [] })),
    }));
    const module = await import('../src/hooks/useAgents');
    const { result } = renderHook(() => module.useAgents());
    await waitFor(() => expect(result.current.statut).toBe('pret'));
  });

  it('useBudgets passe à vide quand aucun budget n’est configuré', async () => {
    vi.doMock('../src/api/budgets', () => ({
      recupereBudgets: vi.fn(async () => ({ budgets: [], alertes: [] })),
    }));
    const module = await import('../src/hooks/useBudgets');
    const { result } = renderHook(() => module.useBudgets());
    await waitFor(() => expect(result.current.statut).toBe('vide'));
  });
});
