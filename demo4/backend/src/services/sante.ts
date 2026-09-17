import { source, synchro } from './depot.js';
import { cycleEnCours } from './periodes.js';
import type { Sante } from '../types.js';

/**
 * Version affichée par `/api/sante`. Ce n'est pas un tarif ni une donnée
 * métier : elle suit `backend/package.json`, recopiée ici pour éviter
 * d'importer un fichier JSON depuis un module ESM sous NodeNext.
 */
const VERSION = '0.1.0';

export async function obtientSante(): Promise<Sante> {
  return {
    statut: 'ok',
    version: VERSION,
    source: await source(),
    synchro: await synchro(),
    cycle: cycleEnCours(),
  };
}
