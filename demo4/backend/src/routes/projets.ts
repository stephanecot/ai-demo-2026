import { Router } from 'express';
import { obtientProjets } from '../services/projets.js';
import { paramTexte } from './aide.js';

export const routeurProjets = Router();

routeurProjets.get('/projets', async (req, res) => {
  const debut = paramTexte(req.query['debut'], 'debut');
  const fin = paramTexte(req.query['fin'], 'fin');
  const projets = await obtientProjets(debut, fin);
  res.json({ projets });
});
