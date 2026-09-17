import { Router } from 'express';
import { obtientResume } from '../services/resume.js';
import { paramTexte } from './aide.js';

export const routeurResume = Router();

routeurResume.get('/resume', async (req, res) => {
  const debut = paramTexte(req.query['debut'], 'debut');
  const fin = paramTexte(req.query['fin'], 'fin');
  res.json(await obtientResume(debut, fin));
});
