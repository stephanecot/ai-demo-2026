import { Router } from 'express';
import { obtientReglages } from '../services/reglages.js';

export const routeurReglages = Router();

routeurReglages.get('/reglages', async (_req, res) => {
  res.json(await obtientReglages());
});
