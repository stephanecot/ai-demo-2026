/**
 * Point d'entrée : monte l'application sur `#racine`, après les tokens de
 * design puis la feuille globale — l'ordre compte, `global.css` s'appuie sur
 * les variables déclarées dans `tokens.css`.
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import { App } from './App';
import './styles/tokens.css';
import './styles/global.css';

const conteneur = document.getElementById('racine');
if (!conteneur) {
  throw new Error("L'élément #racine est introuvable dans le document.");
}

createRoot(conteneur).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
