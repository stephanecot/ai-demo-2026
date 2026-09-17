/**
 * BarreLaterale — la colonne de navigation des trois maquettes, à l'identique :
 * logo, nom du produit, les cinq destinations et le bloc de bas de barre
 * (source des données + pastille de synchro), alimenté par `useSante()`.
 */
import { NavLink } from 'react-router-dom';

import { useSante } from '../../hooks/useSante';
import { COMMUN } from '../../labels';
import type { NomIcone } from '../ui';
import { Icone } from '../ui';
import styles from './BarreLaterale.module.css';

interface Destination {
  readonly chemin: string;
  readonly label: string;
  readonly icone: NomIcone;
}

const DESTINATIONS: readonly Destination[] = [
  { chemin: '/', label: COMMUN.navigation.tableauDeBord, icone: 'tableau-de-bord' },
  { chemin: '/sessions', label: COMMUN.navigation.sessions, icone: 'sessions' },
  { chemin: '/budgets', label: COMMUN.navigation.budgets, icone: 'budgets' },
  { chemin: '/modeles', label: COMMUN.navigation.modelesEtAgents, icone: 'modeles-agents' },
  { chemin: '/reglages', label: COMMUN.navigation.reglages, icone: 'reglages' },
];

/** Minutes écoulées depuis un horodatage ISO, jamais négatives. */
function minutesEcoulees(synchroIso: string): number {
  const ecart = Date.now() - new Date(synchroIso).getTime();
  return Math.max(0, Math.round(ecart / 60_000));
}

function BlocSource() {
  const { data, statut, erreur } = useSante();

  if (statut === 'erreur') {
    return (
      <div className={styles.bloc}>
        <div className={styles.micro}>{COMMUN.barreLaterale.source}</div>
        <div className={styles.texteErreur} title={erreur}>
          {erreur ?? COMMUN.etats.erreurTitre}
        </div>
      </div>
    );
  }

  if (statut === 'chargement' || !data) {
    return (
      <div className={styles.bloc}>
        <div className={styles.micro}>{COMMUN.barreLaterale.source}</div>
        <div className={styles.texteAttenue}>{COMMUN.etats.chargement}</div>
      </div>
    );
  }

  const sourceLabel =
    data.source === 'exemple' ? COMMUN.piedDePage.sourceExemple : COMMUN.piedDePage.sourceTranscripts;
  const texteSynchro = `${COMMUN.barreLaterale.synchroPrefixe} ${minutesEcoulees(data.synchro)} ${COMMUN.barreLaterale.synchroSuffixe}`;

  return (
    <div className={styles.bloc}>
      <div className={styles.micro}>{COMMUN.barreLaterale.source}</div>
      <div className={styles.texteSource}>{sourceLabel}</div>
      <div className={styles.ligneSynchro}>
        <span className={styles.pastilleSynchro} aria-hidden="true" />
        <span className={styles.texteSynchro}>{texteSynchro}</span>
      </div>
    </div>
  );
}

export function BarreLaterale() {
  return (
    <nav className={styles.barre} aria-label={COMMUN.nomProduit}>
      <div className={styles.entete}>
        <span className={styles.logo}>
          <Icone nom="logo" taille={22} titre={COMMUN.nomProduit} />
        </span>
        <div>
          <div className={styles.nom}>{COMMUN.nomProduit}</div>
          <div className={styles.accroche}>{COMMUN.accroche}</div>
        </div>
      </div>

      <ul className={styles.liste}>
        {DESTINATIONS.map((destination) => (
          <li key={destination.chemin}>
            <NavLink
              to={destination.chemin}
              end={destination.chemin === '/'}
              className={({ isActive }) => (isActive ? `${styles.item} ${styles.itemActif}` : styles.item)}
            >
              <Icone nom={destination.icone} taille={16} />
              <span>{destination.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>

      <BlocSource />
    </nav>
  );
}
