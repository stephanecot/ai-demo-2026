/**
 * Formatage des nombres, dates et durées à l'écran — en français.
 *
 * Aucun calcul de coût ici : les montants et les compteurs de tokens arrivent
 * déjà calculés depuis le backend. Ce fichier ne fait que les mettre en forme
 * (séparateurs, arrondis d'affichage, unités, dates).
 */

/** Espace fine insécable : séparateur de milliers du produit. */
const ESPACE_FINE_INSECABLE = ' ';

/** Signe moins typographique, utilisé pour les variations négatives. */
const MOINS = '−';

const MOIS_ABREGES = [
  'janv.',
  'févr.',
  'mars',
  'avr.',
  'mai',
  'juin',
  'juil.',
  'août',
  'sept.',
  'oct.',
  'nov.',
  'déc.',
] as const;

/** Sépare les milliers d'une partie entière (chaîne de chiffres uniquement) par une espace fine. */
function separeMilliers(entier: string): string {
  return entier.replace(/\B(?=(\d{3})+(?!\d))/g, ESPACE_FINE_INSECABLE);
}

/** Formate un nombre en écriture française : virgule décimale, milliers espacés. */
function formateNombre(valeur: number, decimales: number): string {
  const nombre = Number.isFinite(valeur) ? valeur : 0;
  const fixe = nombre.toFixed(decimales);
  const negatif = fixe.startsWith('-');
  const sansSigne = negatif ? fixe.slice(1) : fixe;
  const [entier, partieDecimale] = sansSigne.split('.');
  const entierFormate = separeMilliers(entier ?? '0');
  const corps = partieDecimale ? `${entierFormate},${partieDecimale}` : entierFormate;
  return negatif ? `${MOINS}${corps}` : corps;
}

/** Un montant complet, avec le symbole monétaire : « 1 234,56 $ ». */
export function montant(valeur: number): string {
  return `${formateNombre(valeur, 2)} $`;
}

/**
 * Le même montant, sans le symbole monétaire — pour une tuile qui affiche le
 * « $ » séparément, à côté du chiffre.
 */
export function montantCourt(valeur: number): string {
  return formateNombre(valeur, 2);
}

/** Un compteur de tokens exprimé en millions, une décimale : « 125,6 M ». */
export function tokensMillions(valeur: number): string {
  return `${formateNombre(valeur / 1_000_000, 1)} M`;
}

/** Un pourcentage, une décimale par défaut : « 12,3 % ». */
export function pourcentage(valeur: number, decimales = 1): string {
  return `${formateNombre(valeur, decimales)} %`;
}

/** Une variation signée, toujours précédée de son signe : « +12,3 % » ou « −4,2 % ». */
export function delta(valeur: number, decimales = 1): string {
  const signe = valeur < 0 ? MOINS : '+';
  return `${signe}${formateNombre(Math.abs(valeur), decimales)} %`;
}

/** Interprète une date 'YYYY-MM-DD' ou un horodatage ISO complet, en UTC. */
function analyseDate(iso: string): Date {
  const source = iso.length <= 10 ? `${iso}T00:00:00Z` : iso;
  return new Date(source);
}

/** Une date au format d'écran du produit : « 9 sept. 2026 ». */
export function date(iso: string): string {
  const d = analyseDate(iso);
  const jour = d.getUTCDate();
  const mois = MOIS_ABREGES[d.getUTCMonth()];
  const annee = d.getUTCFullYear();
  return `${jour} ${mois} ${annee}`;
}

/** Une heure au format 24 h, zéro-paddée : « 14:32 ». */
export function heure(iso: string): string {
  const d = analyseDate(iso);
  const h = String(d.getUTCHours()).padStart(2, '0');
  const m = String(d.getUTCMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

/**
 * Une plage de deux dates 'YYYY-MM-DD' inclusives : « 1 → 10 sept. 2026 », ou
 * « 28 déc. 2025 → 3 janv. 2026 » quand la plage franchit un mois ou une année.
 */
export function plage(debut: string, fin: string): string {
  const d1 = analyseDate(debut);
  const d2 = analyseDate(fin);
  const memeAnnee = d1.getUTCFullYear() === d2.getUTCFullYear();
  const memeMois = memeAnnee && d1.getUTCMonth() === d2.getUTCMonth();
  if (memeMois) {
    return `${d1.getUTCDate()} → ${date(fin)}`;
  }
  const debutTexte = memeAnnee
    ? `${d1.getUTCDate()} ${MOIS_ABREGES[d1.getUTCMonth()]}`
    : date(debut);
  return `${debutTexte} → ${date(fin)}`;
}

/**
 * La durée entre deux horodatages ISO, en heures et minutes : « 2 h 39 » sous
 * l'heure pleine, « 45 min » en dessous d'une heure. Jamais négative : une
 * fin antérieure au début est traitée comme une durée nulle.
 */
export function duree(debut: string, fin: string): string {
  const d1 = analyseDate(debut);
  const d2 = analyseDate(fin);
  const minutesTotales = Math.max(0, Math.round((d2.getTime() - d1.getTime()) / 60_000));
  const heures = Math.floor(minutesTotales / 60);
  const minutes = minutesTotales % 60;
  if (heures === 0) {
    return `${minutes} min`;
  }
  return `${heures} h ${String(minutes).padStart(2, '0')}`;
}
