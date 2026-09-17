import { Router } from 'express';
import { obtientLignesExport, type LigneExportCsv } from '../services/export.js';
import { paramTexte } from './aide.js';

export const routeurExport = Router();

const SEPARATEUR = ';';
const SAUT_DE_LIGNE = '\r\n';
const BOM_UTF8 = '\uFEFF'; // pour qu'Excel reconnaisse l'UTF-8 à l'ouverture.

const ENTETES = ['Date', 'Modèle', 'Coût ($)', 'Tokens', 'Part de cache (%)'];

/** Virgule décimale : le fichier est destiné à un tableur français. */
function formateNombre(n: number): string {
  return n.toString().replace('.', ',');
}

function ligneCsv(ligne: LigneExportCsv): string {
  return [
    ligne.date,
    ligne.libelleModele,
    formateNombre(ligne.cout),
    String(ligne.tokens),
    formateNombre(ligne.partCache),
  ].join(SEPARATEUR);
}

function construitCsv(lignes: readonly LigneExportCsv[]): string {
  const corps = [ENTETES.join(SEPARATEUR), ...lignes.map(ligneCsv)];
  return BOM_UTF8 + corps.join(SAUT_DE_LIGNE) + SAUT_DE_LIGNE;
}

routeurExport.get('/export.csv', async (req, res) => {
  const debut = paramTexte(req.query['debut'], 'debut');
  const fin = paramTexte(req.query['fin'], 'fin');
  const lignes = await obtientLignesExport(debut, fin);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="tokenometre-export.csv"');
  res.send(construitCsv(lignes));
});
