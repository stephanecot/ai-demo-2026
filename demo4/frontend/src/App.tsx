/**
 * App — la coquille du produit : barre latérale à gauche, écran de la route
 * active à droite.
 */
import { useRoutes } from 'react-router-dom';

import styles from './App.module.css';
import { BarreLaterale } from './components/mise-en-page/BarreLaterale';
import { ROUTES } from './routes';

export function App() {
  const ecran = useRoutes([...ROUTES]);

  return (
    <div className={styles.coquille}>
      <BarreLaterale />
      {ecran}
    </div>
  );
}
