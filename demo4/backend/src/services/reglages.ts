import { MODELES, TARIFS } from '../domain/tarifs.js';
import { source } from './depot.js';
import { cycleEnCours } from './periodes.js';
import type { Reglages } from '../types.js';

/**
 * `chemin` est un texte d'affichage, jamais un chemin absolu du disque : en
 * mode transcripts, on ne révèle pas la valeur de `TOKENOMETRE_TRANSCRIPTS`,
 * seulement le fait qu'un dossier est configuré.
 */
export async function obtientReglages(): Promise<Reglages> {
  const src = await source();
  const chemin =
    src === 'exemple'
      ? "jeu de données d'exemple (aucun transcript configuré)"
      : 'dossier de transcripts configuré via TOKENOMETRE_TRANSCRIPTS';
  return {
    source: src,
    chemin,
    cycle: cycleEnCours(),
    devise: 'USD',
    modeles: MODELES.map((modele) => ({ modele, libelle: TARIFS[modele].libelle, tarif: TARIFS[modele] })),
  };
}
