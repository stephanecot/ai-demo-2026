import type { DetailSession, ResumeSession } from '../types/api';
import { requeteApi } from './client';
import type { ParametresPeriode } from './resume';

/** Filtre de la liste des sessions : période plus projet optionnel. */
export interface FiltreSessions extends ParametresPeriode {
  readonly projet?: string;
}

interface ReponseSessions {
  readonly sessions: readonly ResumeSession[];
}

/** `GET /api/sessions?debut&fin&projet` — la liste des sessions, plus récentes d'abord. */
export async function recupereSessions(
  filtre: FiltreSessions = {},
  signal?: AbortSignal,
): Promise<readonly ResumeSession[]> {
  const reponse = await requeteApi<ReponseSessions>(
    '/sessions',
    { debut: filtre.debut, fin: filtre.fin, projet: filtre.projet },
    signal,
  );
  return reponse.sessions;
}

/** `GET /api/sessions/:id` — le détail d'une session, tour par tour. */
export function recupereSession(id: string, signal?: AbortSignal): Promise<DetailSession> {
  return requeteApi<DetailSession>(`/sessions/${encodeURIComponent(id)}`, undefined, signal);
}
