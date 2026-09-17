import express from 'express';
import { middlewareErreurs } from './routes/middleware-erreurs.js';
import { routeurApi } from './routes/index.js';

const PORT_PAR_DEFAUT = 3001;

export const app = express();

app.use(express.json());
app.use('/api', routeurApi);
app.use(middlewareErreurs);

// Vitest force `NODE_ENV=test` : on n'écoute jamais un port sous test, pour
// que `supertest` puisse monter `app` directement dans plusieurs fichiers de
// test sans se disputer un port.
if (process.env['NODE_ENV'] !== 'test') {
  const port = Number(process.env['PORT'] ?? PORT_PAR_DEFAUT);
  app.listen(port, () => {
    // La règle ESLint du dépôt n'autorise que `warn`/`error` en console
    // (voir `eslint.config.js` à la racine) : `console.info` y serait rejeté.
    console.warn(`Tokenomètre — API démarrée sur le port ${port}.`);
  });
}
