/**
 * Écran « Modèles & agents » (`/modeles`) — sans maquette dédiée (§1 du plan) :
 * composé uniquement avec le design system existant.
 *
 * Trois sources de données, quatre états combinés : `useResume` (coût et
 * détail des quatre postes par modèle), `useAgents` (coût par agent et par
 * outil) et `useReglages` (les tarifs $/M affichés dans les panneaux de
 * modèle — jamais une constante écrite ici). Aucun calcul de coût : les
 * seules divisions faites ici sont des parts d'un total déjà chiffré par le
 * backend (répartition par modèle, part d'un outil), pas des tarifs.
 */
import { useMemo, useState } from 'react';

import { montantCourt, pourcentage, tokensMillions } from '../../format';
import { BandeauErreur, Encart, EtatVide, Icone, Panneau, Pastille, SegmentControl, Tableau } from '../../components/ui';
import type { ColonneTableau } from '../../components/ui';
import { Ecran } from '../../components/mise-en-page/Ecran';
import { EnTeteEcran } from '../../components/mise-en-page/EnTeteEcran';
import { PiedDePage } from '../../components/mise-en-page/PiedDePage';
import { useAgents } from '../../hooks/useAgents';
import { useReglages } from '../../hooks/useReglages';
import { useResume } from '../../hooks/useResume';
import type { StatutRessource } from '../../hooks/useRessource';
import { COMMUN, ERREURS, MODELES, MODELES_ET_AGENTS, REGLAGES } from '../../labels';
import type { LigneAgent, LigneModele, LigneOutil, ModeleId, Tarif } from '../../types/api';
import { BarreRepartition } from './BarreRepartition';
import type { SegmentRepartition } from './BarreRepartition';
import styles from './ModelesEtAgents.module.css';
import { calculeBornes, MICRO_LABEL_PERIODE, OPTIONS_PERIODE } from './periode';
import type { PeriodeCode } from './periode';
import { TEXTES_MODELES } from './textesLocaux';

/** Ordre d'affichage fixe des trois modèles — jamais réordonné par un tri. */
const ORDRE_MODELES: readonly ModeleId[] = ['claude-opus-5', 'claude-sonnet-5', 'claude-haiku-4-5'];

const COULEUR_MODELE: Readonly<Record<ModeleId, string>> = {
  'claude-opus-5': 'var(--modele-opus)',
  'claude-sonnet-5': 'var(--modele-sonnet)',
  'claude-haiku-4-5': 'var(--modele-haiku)',
};

interface PosteAffiche {
  readonly cle: string;
  readonly libelle: string;
  readonly tokens: number;
  readonly tarif: number | undefined;
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

function PanneauModele({ ligne, tarif }: { readonly ligne: LigneModele; readonly tarif: Tarif | undefined }) {
  const postes: readonly PosteAffiche[] = [
    { cle: 'entree', libelle: REGLAGES.colonneEntree, tokens: ligne.usage.entree, tarif: tarif?.entree },
    { cle: 'sortie', libelle: REGLAGES.colonneSortie, tokens: ligne.usage.sortie, tarif: tarif?.sortie },
    { cle: 'cacheEcriture', libelle: REGLAGES.colonneCacheEcriture, tokens: ligne.usage.cacheEcriture, tarif: tarif?.cacheEcriture },
    { cle: 'cacheLecture', libelle: REGLAGES.colonneCacheLecture, tokens: ligne.usage.cacheLecture, tarif: tarif?.cacheLecture },
  ];

  return (
    <Panneau>
      <div className={styles.enteteModele}>
        <Pastille couleur={COULEUR_MODELE[ligne.modele]} taille={9} />
        <span className={styles.libelleModele}>{ligne.libelle}</span>
      </div>
      <div className={styles.chiffreCout}>{montantCourt(ligne.cout)} $</div>
      <div className={styles.statsSecondaires}>
        <span>
          <span className={styles.valeur}>{tokensMillions(ligne.tokens)}</span> {COMMUN.unites.tokens}
        </span>
        <span>
          {MODELES_ET_AGENTS.colonnePartCache} <span className={styles.valeur}>{pourcentage(ligne.partCache, 0)}</span>
        </span>
      </div>
      <div className={styles.postes}>
        {postes.map((poste) => (
          <div key={poste.cle} className={styles.posteLigne}>
            <span className={styles.posteLibelle}>{poste.libelle}</span>
            <span className={styles.posteValeur}>{tokensMillions(poste.tokens)}</span>
            <span className={styles.posteValeur}>
              {poste.tarif === undefined ? TEXTES_MODELES.tarifIndisponible : `${montantCourt(poste.tarif)} ${REGLAGES.uniteTarif}`}
            </span>
          </div>
        ))}
      </div>
    </Panneau>
  );
}

export default function ModelesEtAgents() {
  const [periode, setPeriode] = useState<PeriodeCode>('cycle');
  const bornes = useMemo(() => calculeBornes(periode), [periode]);

  const resumeRes = useResume(bornes);
  const agentsRes = useAgents(bornes);
  const reglagesRes = useReglages();

  const statutBase = combineStatuts([resumeRes.statut, agentsRes.statut, reglagesRes.statut]);
  const estVide =
    statutBase === 'pret' &&
    resumeRes.statut === 'vide' &&
    agentsRes.statut === 'vide';
  const statut = estVide ? 'vide' : statutBase;

  const erreur = resumeRes.erreur ?? agentsRes.erreur ?? reglagesRes.erreur ?? ERREURS.inattendue;

  function rechargerTout() {
    resumeRes.recharger();
    agentsRes.recharger();
    reglagesRes.recharger();
  }

  const tarifParModele = useMemo(() => {
    const table = new Map<ModeleId, Tarif>();
    for (const entree of reglagesRes.data?.modeles ?? []) {
      table.set(entree.modele, entree.tarif);
    }
    return table;
  }, [reglagesRes.data]);

  const totalOutils = useMemo(
    () => (agentsRes.data?.outils ?? []).reduce((somme, ligne) => somme + ligne.cout, 0),
    [agentsRes.data],
  );

  const colonnesAgents: readonly ColonneTableau<LigneAgent>[] = [
    { cle: 'agent', libelle: MODELES_ET_AGENTS.colonneAgent, largeur: '1.4fr', rendu: (ligne) => ligne.agent },
    {
      cle: 'appels',
      libelle: MODELES_ET_AGENTS.colonneAppels,
      largeur: '84px',
      numerique: true,
      rendu: (ligne) => String(ligne.appels),
    },
    {
      cle: 'repartition',
      libelle: TEXTES_MODELES.colonneRepartition,
      largeur: '1.6fr',
      rendu: (ligne) => {
        const segments: readonly SegmentRepartition[] = ORDRE_MODELES.map((modele) => ({
          modele,
          couleur: COULEUR_MODELE[modele],
          valeur: ligne.parModele[modele],
        }));
        const total = segments.reduce((somme, segment) => somme + segment.valeur, 0);
        const detail = segments
          .filter((segment) => segment.valeur > 0)
          .map((segment) => `${MODELES[segment.modele]} ${pourcentage(total > 0 ? (segment.valeur / total) * 100 : 0, 0)}`)
          .join(', ');
        return (
          <BarreRepartition
            segments={segments}
            libelleAccessible={TEXTES_MODELES.libelleAccessibleRepartition(detail || TEXTES_MODELES.aucuneRepartition)}
          />
        );
      },
    },
    {
      cle: 'cout',
      libelle: MODELES_ET_AGENTS.colonneCout,
      largeur: '96px',
      numerique: true,
      rendu: (ligne) => montantCourt(ligne.cout),
    },
    {
      cle: 'economie',
      libelle: TEXTES_MODELES.colonneEconomie,
      largeur: '132px',
      numerique: true,
      rendu: (ligne) => montantCourt(ligne.economieSiSonnet),
    },
  ];

  const colonnesOutils: readonly ColonneTableau<LigneOutil>[] = [
    { cle: 'outil', libelle: MODELES_ET_AGENTS.colonneOutil, rendu: (ligne) => ligne.outil },
    {
      cle: 'appels',
      libelle: MODELES_ET_AGENTS.colonneAppels,
      largeur: '96px',
      numerique: true,
      rendu: (ligne) => String(ligne.appels),
    },
    {
      cle: 'cout',
      libelle: MODELES_ET_AGENTS.colonneCout,
      largeur: '96px',
      numerique: true,
      rendu: (ligne) => montantCourt(ligne.cout),
    },
    {
      cle: 'part',
      libelle: TEXTES_MODELES.colonnePart,
      largeur: '84px',
      numerique: true,
      rendu: (ligne) => pourcentage(totalOutils > 0 ? (ligne.cout / totalOutils) * 100 : 0, 0),
    },
  ];

  return (
    <Ecran>
      <EnTeteEcran
        microLabel={MICRO_LABEL_PERIODE[periode]}
        titre={MODELES_ET_AGENTS.titre}
        actions={
          <SegmentControl
            options={OPTIONS_PERIODE}
            valeur={periode}
            onChange={setPeriode}
            libelleAccessible={TEXTES_MODELES.periodeAccessible}
          />
        }
      />

      {statut === 'chargement' && (
        <div className={styles.etat} role="status">
          {COMMUN.etats.chargement}
        </div>
      )}

      {statut === 'erreur' && <BandeauErreur message={erreur} onReessayer={rechargerTout} />}

      {statut === 'vide' && <EtatVide titre={MODELES_ET_AGENTS.videTitre} detail={MODELES_ET_AGENTS.videDetail} />}

      {statut === 'pret' && resumeRes.data && agentsRes.data && (
        <>
          <div className={styles.ligneModeles}>
            {resumeRes.data.parModele.map((ligne) => (
              <PanneauModele key={ligne.modele} ligne={ligne} tarif={tarifParModele.get(ligne.modele)} />
            ))}
          </div>

          <Panneau titre={MODELES_ET_AGENTS.sectionAgents}>
            <ul className={styles.legende}>
              {ORDRE_MODELES.map((modele) => (
                <li key={modele} className={styles.legendeItem}>
                  <Pastille couleur={COULEUR_MODELE[modele]} taille={9} />
                  <span>{MODELES[modele]}</span>
                </li>
              ))}
            </ul>
            <Encart tonalite="ok" icone={<Icone nom="coche" taille={15} />}>
              {TEXTES_MODELES.encartEconomie}
            </Encart>
            <Tableau
              colonnes={colonnesAgents}
              lignes={agentsRes.data.agents}
              cleLigne={(ligne) => ligne.agent}
              messageVide={MODELES_ET_AGENTS.videTitre}
            />
          </Panneau>

          <Panneau titre={MODELES_ET_AGENTS.sectionOutils}>
            <Tableau
              colonnes={colonnesOutils}
              lignes={agentsRes.data.outils}
              cleLigne={(ligne) => ligne.outil}
              messageVide={MODELES_ET_AGENTS.videTitre}
            />
          </Panneau>

          <p className={styles.mention}>{MODELES_ET_AGENTS.mentionRecalcul}</p>
        </>
      )}

      <PiedDePage />
    </Ecran>
  );
}
