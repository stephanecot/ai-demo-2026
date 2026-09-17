/**
 * Écran « Réglages » (`/reglages`) — sans maquette dédiée (§1 du plan),
 * composé uniquement avec le design system existant. Lecture seule : il
 * montre l'état réel du système, il ne promet aucun réglage modifiable.
 *
 * Deux sources : `useReglages` (source active, chemin, cycle, tarifs) et
 * `useSante` (dernière synchro). Les tarifs affichés sont ceux que le
 * backend renvoie, jamais une constante écrite ici.
 */
import { useMemo } from 'react';

import { date, heure, montantCourt, plage } from '../../format';
import { Badge, BandeauErreur, EtatVide, Jauge, Panneau, Pastille, Tableau } from '../../components/ui';
import type { ColonneTableau } from '../../components/ui';
import { Ecran } from '../../components/mise-en-page/Ecran';
import { EnTeteEcran } from '../../components/mise-en-page/EnTeteEcran';
import { PiedDePage } from '../../components/mise-en-page/PiedDePage';
import { useReglages } from '../../hooks/useReglages';
import { useSante } from '../../hooks/useSante';
import type { StatutRessource } from '../../hooks/useRessource';
import { COMMUN, ERREURS, REGLAGES } from '../../labels';
import type { ModeleId, Reglages as ReglagesDto, Tarif } from '../../types/api';
import styles from './Reglages.module.css';
import { TEXTES_REGLAGES } from './textesLocaux';

const COULEUR_MODELE: Readonly<Record<ModeleId, string>> = {
  'claude-opus-5': 'var(--modele-opus)',
  'claude-sonnet-5': 'var(--modele-sonnet)',
  'claude-haiku-4-5': 'var(--modele-haiku)',
};

interface LigneTarif {
  readonly modele: ModeleId;
  readonly libelle: string;
  readonly tarif: Tarif;
}

/** Combine les statuts de plusieurs ressources : erreur > chargement > prêt. */
function combineStatuts(statuts: readonly StatutRessource[]): 'erreur' | 'chargement' | 'pret' {
  if (statuts.includes('erreur')) {
    return 'erreur';
  }
  if (statuts.includes('chargement')) {
    return 'chargement';
  }
  return 'pret';
}

export default function Reglages() {
  const reglagesRes = useReglages();
  const santeRes = useSante();

  const statutBase = combineStatuts([reglagesRes.statut, santeRes.statut]);
  const reglages: ReglagesDto | undefined = reglagesRes.data;
  const estVide = statutBase === 'pret' && (reglages?.modeles.length ?? 0) === 0;
  const statut = estVide ? 'vide' : statutBase;

  const erreur = reglagesRes.erreur ?? santeRes.erreur ?? ERREURS.inattendue;

  function rechargerTout() {
    reglagesRes.recharger();
    santeRes.recharger();
  }

  const colonnesTarifs: readonly ColonneTableau<LigneTarif>[] = [
    {
      cle: 'modele',
      libelle: REGLAGES.colonneModele,
      largeur: '1.2fr',
      rendu: (ligne) => (
        <span className={styles.modeleCell}>
          <Pastille couleur={COULEUR_MODELE[ligne.modele]} taille={9} />
          <span>{ligne.libelle}</span>
        </span>
      ),
    },
    {
      cle: 'entree',
      libelle: REGLAGES.colonneEntree,
      numerique: true,
      rendu: (ligne) => montantCourt(ligne.tarif.entree),
    },
    {
      cle: 'sortie',
      libelle: REGLAGES.colonneSortie,
      numerique: true,
      rendu: (ligne) => montantCourt(ligne.tarif.sortie),
    },
    {
      cle: 'cacheEcriture',
      libelle: REGLAGES.colonneCacheEcriture,
      numerique: true,
      rendu: (ligne) => montantCourt(ligne.tarif.cacheEcriture),
    },
    {
      cle: 'cacheLecture',
      libelle: REGLAGES.colonneCacheLecture,
      numerique: true,
      rendu: (ligne) => montantCourt(ligne.tarif.cacheLecture),
    },
  ];

  const sourceLabel =
    reglages?.source === 'transcripts' ? REGLAGES.sourceTranscriptsLabel : REGLAGES.sourceExempleLabel;

  const texteSynchro = useMemo(() => {
    if (!santeRes.data) {
      return undefined;
    }
    return `${date(santeRes.data.synchro)} · ${heure(santeRes.data.synchro)}`;
  }, [santeRes.data]);

  return (
    <Ecran>
      <EnTeteEcran microLabel={TEXTES_REGLAGES.microLabel} titre={REGLAGES.titre} />

      {statut === 'chargement' && (
        <div className={styles.etat} role="status">
          {COMMUN.etats.chargement}
        </div>
      )}

      {statut === 'erreur' && <BandeauErreur message={erreur} onReessayer={rechargerTout} />}

      {statut === 'vide' && <EtatVide titre={REGLAGES.videTitre} detail={REGLAGES.videDetail} />}

      {statut === 'pret' && reglages && (
        <>
          <Panneau titre={REGLAGES.sectionSource}>
            <div className={styles.ligneSource}>
              <Badge tonalite="neutre">{sourceLabel}</Badge>
            </div>
            <dl className={styles.grille}>
              <div className={styles.champ}>
                <dt className={styles.champLabel}>{REGLAGES.cheminLabel}</dt>
                <dd className={styles.champValeur}>{reglages.chemin}</dd>
              </div>
              <div className={styles.champ}>
                <dt className={styles.champLabel}>{TEXTES_REGLAGES.derniereSynchroLabel}</dt>
                <dd className={styles.champValeur}>{texteSynchro ?? TEXTES_REGLAGES.derniereSynchroLabel}</dd>
              </div>
            </dl>
            <p className={styles.mention}>{TEXTES_REGLAGES.bascule}</p>
          </Panneau>

          <Panneau titre={REGLAGES.sectionCycle}>
            <div className={styles.ligneCycle}>
              <span className={styles.valeurCycle}>{plage(reglages.cycle.debut, reglages.cycle.fin)}</span>
              <span className={styles.texteSecondaire}>{COMMUN.barreLaterale.jourDe(reglages.cycle.jour, reglages.cycle.jours)}</span>
            </div>
            <Jauge
              valeur={reglages.cycle.jour}
              plafond={reglages.cycle.jours}
              tonalite="ok"
              libelleAccessible={TEXTES_REGLAGES.progressionAccessible(reglages.cycle.jour, reglages.cycle.jours)}
            />
          </Panneau>

          <Panneau titre={REGLAGES.sectionTarifs} sousTitre={REGLAGES.uniteTarif}>
            <Tableau
              colonnes={colonnesTarifs}
              lignes={reglages.modeles}
              cleLigne={(ligne) => ligne.modele}
              messageVide={REGLAGES.videTitre}
            />
            <p className={styles.mentionTarifs}>{TEXTES_REGLAGES.mentionSourceVerite}</p>
          </Panneau>
        </>
      )}

      <PiedDePage />
    </Ecran>
  );
}
