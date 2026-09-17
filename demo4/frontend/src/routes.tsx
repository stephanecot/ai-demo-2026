/**
 * routes.tsx — la carte des six routes du produit (§5 du plan).
 *
 * Les écrans sont importés par leur chemin final sous `src/ecrans/`. Certains
 * n'existent pas encore au moment où ce fichier est écrit : d'autres agents
 * les livrent en parallèle (voir le rapport de mission de `react-dev`).
 */
import type { RouteObject } from 'react-router-dom';

import Budgets from './ecrans/Budgets';
import ModelesEtAgents from './ecrans/ModelesEtAgents';
import Reglages from './ecrans/Reglages';
import Session from './ecrans/Session';
import Sessions from './ecrans/Sessions';
import TableauDeBord from './ecrans/TableauDeBord';

export const ROUTES: readonly RouteObject[] = [
  { path: '/', element: <TableauDeBord /> },
  { path: '/sessions', element: <Sessions /> },
  { path: '/sessions/:id', element: <Session /> },
  { path: '/budgets', element: <Budgets /> },
  { path: '/modeles', element: <ModelesEtAgents /> },
  { path: '/reglages', element: <Reglages /> },
];
