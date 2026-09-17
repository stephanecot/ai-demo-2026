import { Router } from 'express';
import { obtientSante } from '../services/sante.js';

export const routeurSante = Router();

routeurSante.get('/sante', async (_req, res) => {
  res.json(await obtientSante());
});
