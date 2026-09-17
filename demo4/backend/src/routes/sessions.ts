import { Router } from 'express';
import { listeSessions, obtientDetailSession } from '../services/sessions.js';
import { paramRoute, paramTexte } from './aide.js';

export const routeurSessions = Router();

routeurSessions.get('/sessions', async (req, res) => {
  const debut = paramTexte(req.query['debut'], 'debut');
  const fin = paramTexte(req.query['fin'], 'fin');
  const projet = paramTexte(req.query['projet'], 'projet');
  const sessions = await listeSessions(debut, fin, projet);
  res.json({ sessions });
});

routeurSessions.get('/sessions/:id', async (req, res) => {
  const id = paramRoute(req.params['id'], 'id');
  res.json(await obtientDetailSession(id));
});
