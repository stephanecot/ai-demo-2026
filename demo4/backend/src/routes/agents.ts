import { Router } from 'express';
import { obtientAgents } from '../services/agents.js';
import { paramTexte } from './aide.js';

export const routeurAgents = Router();

routeurAgents.get('/agents', async (req, res) => {
  const debut = paramTexte(req.query['debut'], 'debut');
  const fin = paramTexte(req.query['fin'], 'fin');
  res.json(await obtientAgents(debut, fin));
});
