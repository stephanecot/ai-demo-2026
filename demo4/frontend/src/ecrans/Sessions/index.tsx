/**
 * Sessions — la liste des sessions Claude Code sur une période, filtrable
 * par projet. Pas de maquette dédiée (§1 du plan) : composé avec les mêmes
 * pièces que les écrans maquettés. Une ligne mène au détail de la session
 * (`/sessions/:id`), au clic comme au clavier — porté par `Tableau`.
 */
import { useMemo, useState } from 'react';

import { useNavigate } from 'react-router-dom';

import { Ecran } from '../../components/mise-en-page/Ecran';
import { EnTeteEcran } from '../../components/mise-en-page/EnTeteEcran';
import { PiedDePage } from '../../components/mise-en-page/PiedDePage';
import { BandeauErreur, EtatVide, Panneau, SegmentControl, Tableau } from '../../components/ui';
import type { ColonneTableau, OptionSegment } from '../../components/ui';
import { date as formateDate, heure as formateHeure, montantCourt, plage, pourcentage, tokensMillions } from '../../format';
import { useProjets } from '../../hooks/useProjets';
import { useSessions } from '../../hooks/useSessions';
import { COMMUN, SESSION, SESSIONS, TABLEAU_DE_BORD } from '../../labels';
import type { ResumeSession } from '../../types/api';
import { derniersJours } from './periode';
import styles from './Sessions.module.css';

type ClePeriode = '7j' | '30j';

const OPTIONS_PERIODE: readonly OptionSegment<ClePeriode>[] = [
  { valeur: '7j', libelle: TABLEAU_DE_BORD.segmentPeriodes['7j'] },
  { valeur: '30j', libelle: TABLEAU_DE_BORD.segmentPeriodes['30j'] },
];

/** Valeur de sélection du filtre projet représentant « tous les projets ». */
const TOUS_LES_PROJETS = '__tous__';

export default function Sessions() {
  const [periode, setPeriode] = useState<ClePeriode>('7j');
  const [projetChoisi, setProjetChoisi] = useState<string>(TOUS_LES_PROJETS);
  const navigate = useNavigate();

  const bornes = derniersJours(periode === '7j' ? 7 : 30);
  const filtreProjet = projetChoisi === TOUS_LES_PROJETS ? undefined : projetChoisi;

  const projets = useProjets({ debut: bornes.debut, fin: bornes.fin });
  const sessions = useSessions(
    filtreProjet === undefined
      ? { debut: bornes.debut, fin: bornes.fin }
      : { debut: bornes.debut, fin: bornes.fin, projet: filtreProjet },
  );

  const colonnes = useMemo<readonly ColonneTableau<ResumeSession>[]>(
    () => [
      {
        cle: 'session',
        libelle: SESSIONS.colonneSession,
        largeur: '1.4fr',
        rendu: (session) => (
          <span className={styles.celluleSession}>
            <span className={styles.idCourt}>{session.id}</span>
            <span className={styles.brancheCourte}>{session.branche}</span>
          </span>
        ),
      },
      {
        cle: 'projet',
        libelle: SESSIONS.colonneProjet,
        largeur: '1fr',
        rendu: (session) => session.projet,
      },
      {
        cle: 'debut',
        libelle: SESSIONS.colonneDebut,
        largeur: '1.3fr',
        rendu: (session) => `${formateDate(session.debut)}, ${formateHeure(session.debut)}`,
      },
      {
        cle: 'tours',
        libelle: SESSIONS.colonneTours,
        largeur: '72px',
        numerique: true,
        rendu: (session) => String(session.tours),
      },
      {
        cle: 'tokens',
        libelle: TABLEAU_DE_BORD.projets.colonneTokens,
        largeur: '96px',
        numerique: true,
        rendu: (session) => tokensMillions(session.tokens),
      },
      {
        cle: 'cache',
        libelle: SESSION.tuiles.cache,
        largeur: '80px',
        numerique: true,
        rendu: (session) => pourcentage(session.partCache, 0),
      },
      {
        cle: 'cout',
        libelle: SESSIONS.colonneCout,
        largeur: '96px',
        numerique: true,
        rendu: (session) => montantCourt(session.cout),
      },
    ],
    [],
  );

  return (
    <Ecran>
      <EnTeteEcran
        microLabel={plage(bornes.debut, bornes.fin)}
        titre={SESSIONS.titre}
        actions={
          <SegmentControl
            options={OPTIONS_PERIODE}
            valeur={periode}
            onChange={setPeriode}
            libelleAccessible={SESSIONS.titre}
          />
        }
      />

      <div className={styles.filtres}>
        <label className={styles.filtreProjet}>
          <span className={styles.filtreProjetLabel}>{SESSIONS.filtreProjetLabel}</span>
          <select
            className={styles.select}
            value={projetChoisi}
            onChange={(evenement) => setProjetChoisi(evenement.target.value)}
          >
            <option value={TOUS_LES_PROJETS}>{SESSIONS.filtreProjetTous}</option>
            {(projets.data ?? []).map((ligne) => (
              <option key={ligne.projet} value={ligne.projet}>
                {ligne.projet}
              </option>
            ))}
          </select>
        </label>
      </div>

      {sessions.statut === 'chargement' && (
        <p className={styles.chargement} role="status">
          {COMMUN.etats.chargement}
        </p>
      )}

      {sessions.statut === 'erreur' && (
        <BandeauErreur
          message={sessions.erreur ?? COMMUN.etats.erreurTitre}
          onReessayer={sessions.recharger}
          libelleReessayer={COMMUN.etats.reessayer}
        />
      )}

      {sessions.statut === 'vide' && <EtatVide titre={SESSIONS.videTitre} detail={SESSIONS.videDetail} />}

      {sessions.statut === 'pret' && sessions.data && (
        <Panneau>
          <Tableau
            colonnes={colonnes}
            lignes={sessions.data}
            cleLigne={(session) => session.id}
            messageVide={SESSIONS.videTitre}
            onLigneClic={(session) => navigate(`/sessions/${encodeURIComponent(session.id)}`)}
          />
        </Panneau>
      )}

      <PiedDePage />
    </Ecran>
  );
}
