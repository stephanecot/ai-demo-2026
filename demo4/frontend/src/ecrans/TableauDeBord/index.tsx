/**
 * Écran « Tableau de bord » (`design/Main.dc.html`).
 *
 * Tous les chiffres viennent de `useResume` / `useProjets` : cet écran
 * n'additionne, ne multiplie ni ne divise jamais un coût ou un compteur de
 * tokens — il affiche et formate ce que le backend a déjà calculé.
 *
 * Écart documenté au contrat : `PointJournalier` (§4.1 du plan) ne porte
 * qu'un coût par jour et par modèle, pas de compteur de tokens quotidien.
 * Le graphique quotidien reste donc toujours construit à partir du coût,
 * seule donnée vraiment quotidienne disponible ; la bascule « TOKENS » du
 * sélecteur d'unité change le titre et les libellés d'axe (ce que le plan
 * demande explicitement), mais ne réinvente pas une répartition quotidienne
 * de tokens par modèle à partir du coût — ce serait recalculer un tarif
 * côté frontend, ce que la règle d'or du produit interdit.
 */
import { useEffect, useMemo, useState } from 'react';

import { recupereExportCsv } from '../../api/resume';
import {
  BandeauErreur,
  BarresEmpilees,
  BoutonFantome,
  Encart,
  EtatVide,
  Icone,
  Jauge,
  MicroCourbe,
  Panneau,
  SegmentControl,
  Tableau,
  Tuile,
} from '../../components/ui';
import type { ColonneBarres, ColonneTableau, OptionSegment } from '../../components/ui';
import { Ecran } from '../../components/mise-en-page/Ecran';
import { EnTeteEcran } from '../../components/mise-en-page/EnTeteEcran';
import { PiedDePage } from '../../components/mise-en-page/PiedDePage';
import { date, delta as formateDelta, montant, montantCourt, plage, pourcentage, tokensMillions } from '../../format';
import { useProjets } from '../../hooks/useProjets';
import { useResume } from '../../hooks/useResume';
import { COMMUN, ERREURS, MODELES, TABLEAU_DE_BORD } from '../../labels';
import type { LigneProjet } from '../../types/api';
import { COULEUR_MODELE_HEX, COULEUR_MODELE_VAR, ORDRE_MODELES } from './modeles';
import { PostesChers } from './PostesChers';
import type { ClePeriode, Unite } from './periode';
import { bornesPourPeriode, cleBornes, dernierJourDonnees, etatDepuisPourcentage } from './periode';
import { RepartitionModele } from './RepartitionModele';
import styles from './TableauDeBord.module.css';
import { TuileCache } from './TuileCache';

const OPTIONS_PERIODE: readonly OptionSegment<ClePeriode>[] = [
  { valeur: '7j', libelle: TABLEAU_DE_BORD.segmentPeriodes['7j'] },
  { valeur: '10j', libelle: TABLEAU_DE_BORD.segmentPeriodes['10j'] },
  { valeur: '30j', libelle: TABLEAU_DE_BORD.segmentPeriodes['30j'] },
  { valeur: 'trimestre', libelle: TABLEAU_DE_BORD.segmentPeriodes.trimestre },
];

const OPTIONS_UNITE: readonly OptionSegment<Unite>[] = [
  { valeur: 'cout', libelle: TABLEAU_DE_BORD.segmentUnites.cout },
  { valeur: 'tokens', libelle: TABLEAU_DE_BORD.segmentUnites.tokens },
];

const COLONNES_PROJETS: readonly ColonneTableau<LigneProjet>[] = [
  {
    cle: 'projet',
    libelle: TABLEAU_DE_BORD.projets.colonneProjet,
    largeur: '1.7fr',
    rendu: (ligne) => (
      <span className={styles.celluleProjet}>
        <span
          className={styles.teinte}
          style={{ background: COULEUR_MODELE_VAR[ligne.modeleDominant] }}
          aria-hidden="true"
        />
        <span className={styles.nomProjet}>{ligne.projet}</span>
      </span>
    ),
  },
  {
    cle: 'cout',
    libelle: TABLEAU_DE_BORD.projets.colonneCout,
    numerique: true,
    rendu: (ligne) => montant(ligne.cout),
  },
  {
    cle: 'tokens',
    libelle: TABLEAU_DE_BORD.projets.colonneTokens,
    numerique: true,
    rendu: (ligne) => tokensMillions(ligne.tokens),
  },
  {
    cle: 'part',
    libelle: TABLEAU_DE_BORD.projets.colonnePart,
    numerique: true,
    rendu: (ligne) => pourcentage(ligne.part, 0),
  },
];

const CLASSE_TON_JAUGE: Record<'ok' | 'vigilance' | 'limite' | 'depassement', string> = {
  ok: styles.jaugeTexteOk ?? '',
  vigilance: styles.jaugeTexteVigilance ?? '',
  limite: styles.jaugeTexteLimite ?? '',
  depassement: styles.jaugeTexteDepassement ?? '',
};

export default function TableauDeBord() {
  const [clePeriode, setClePeriode] = useState<ClePeriode>('10j');
  const [unite, setUnite] = useState<Unite>('cout');
  const [ancre, setAncre] = useState<string | undefined>(undefined);
  const [jourSelectionne, setJourSelectionne] = useState<string | undefined>(undefined);
  const [projetSelectionne, setProjetSelectionne] = useState<string | undefined>(undefined);
  const [erreurExport, setErreurExport] = useState<string | undefined>(undefined);

  const bornesPeriode = useMemo(() => bornesPourPeriode(clePeriode, ancre), [clePeriode, ancre]);
  const resume = useResume(bornesPeriode);

  // L'ancre « aujourd'hui » des périodes glissantes suit la dernière journée
  // réellement chargée — jamais l'horloge du navigateur, pour rester
  // déterministe sur le jeu d'exemple comme sur des transcripts réels.
  useEffect(() => {
    if (resume.statut !== 'pret' && resume.statut !== 'vide') {
      return;
    }
    const dernier = dernierJourDonnees(resume.data);
    if (dernier === undefined) {
      return;
    }
    setAncre((precedente) => (precedente === dernier ? precedente : dernier));
  }, [resume.statut, resume.data]);

  const clefBornesPeriode = cleBornes(bornesPeriode);
  useEffect(() => {
    setJourSelectionne(undefined);
  }, [clefBornesPeriode]);

  const bornesProjets = jourSelectionne !== undefined ? { debut: jourSelectionne, fin: jourSelectionne } : bornesPeriode;
  const projets = useProjets(bornesProjets);

  useEffect(() => {
    if (projets.statut !== 'pret' && projets.statut !== 'vide') {
      return;
    }
    const liste = projets.data ?? [];
    setProjetSelectionne((precedent) => {
      if (precedent !== undefined && liste.some((ligne) => ligne.projet === precedent)) {
        return precedent;
      }
      const [premier] = liste;
      return premier?.projet;
    });
  }, [projets.statut, projets.data]);

  const projetActuel = projets.data?.find((ligne) => ligne.projet === projetSelectionne);

  async function exporterCsv() {
    setErreurExport(undefined);
    try {
      const texte = await recupereExportCsv(bornesPeriode);
      const debutFichier = bornesPeriode.debut ?? resume.data?.debut ?? 'periode';
      const finFichier = bornesPeriode.fin ?? resume.data?.fin ?? 'periode';
      const blob = new Blob([texte], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const lien = document.createElement('a');
      lien.href = url;
      lien.download = `tokenometre-${debutFichier}-${finFichier}.csv`;
      document.body.appendChild(lien);
      lien.click();
      lien.remove();
      URL.revokeObjectURL(url);
    } catch (cause) {
      setErreurExport(cause instanceof Error ? cause.message : ERREURS.inattendue);
    }
  }

  // Vide plutôt qu'un texte de repli : « Chargement… » est déjà porté par
  // l'état chargement du corps de l'écran, pas la peine de le dupliquer ici.
  const microLabel = resume.data ? plage(resume.data.debut, resume.data.fin) : '';
  const chartTitre = unite === 'cout' ? TABLEAU_DE_BORD.graphique.titreCout : TABLEAU_DE_BORD.graphique.titreTokens;

  const colonnesGraphique: readonly ColonneBarres[] = (resume.data?.parJour ?? []).map((point) => ({
    cle: point.date,
    libelleAxe: point.date.slice(8, 10),
    libelleEntete: `${date(point.date)} · ${montant(point.cout)}`,
    segments: ORDRE_MODELES.map((modele) => ({
      cle: modele,
      libelle: MODELES[modele],
      couleur: COULEUR_MODELE_HEX[modele],
      valeur: point.parModele[modele],
      valeurAffichee: montant(point.parModele[modele]),
    })),
  }));
  // Le maximum de l'axe reprend `point.cout` (déjà calculé par le backend), jamais
  // une somme recomposée à partir des segments par modèle.
  const maxJour = Math.max(0, ...(resume.data?.parJour ?? []).map((point) => point.cout));

  const tonaliteJauge = resume.data ? etatDepuisPourcentage(resume.data.partPlafond) : 'ok';

  return (
    <Ecran>
      <EnTeteEcran
        microLabel={microLabel}
        titre={TABLEAU_DE_BORD.titre}
        actions={
          <>
            <SegmentControl
              options={OPTIONS_PERIODE}
              valeur={clePeriode}
              onChange={setClePeriode}
              libelleAccessible="Période"
            />
            <SegmentControl options={OPTIONS_UNITE} valeur={unite} onChange={setUnite} libelleAccessible="Unité" />
            <BoutonFantome
              icone={<Icone nom="export" taille={14} />}
              onClick={() => {
                void exporterCsv();
              }}
            >
              {COMMUN.actions.exporterCsv}
            </BoutonFantome>
          </>
        }
      />

      {erreurExport && (
        <BandeauErreur
          message={erreurExport}
          onReessayer={() => {
            void exporterCsv();
          }}
        />
      )}

      {resume.statut === 'chargement' && (
        <p className="micro" role="status">
          {COMMUN.etats.chargement}
        </p>
      )}

      {resume.statut === 'erreur' && (
        <BandeauErreur message={resume.erreur ?? ERREURS.inattendue} onReessayer={resume.recharger} />
      )}

      {resume.statut === 'vide' && (
        <EtatVide titre={TABLEAU_DE_BORD.videTitre} detail={TABLEAU_DE_BORD.videDetail} />
      )}

      {resume.statut === 'pret' && resume.data && (
        <>
          <div className={styles.grilleTuiles}>
            <Tuile
              libelle={TABLEAU_DE_BORD.tuiles.coutPeriode(TABLEAU_DE_BORD.segmentPeriodes[clePeriode])}
              valeur={montantCourt(resume.data.cout)}
              unite={COMMUN.unites.cout}
              tonalite="accent"
              delta={{
                texte: `${formateDelta(resume.data.deltaPeriodePrecedente)} ${TABLEAU_DE_BORD.tuiles.vsPeriodePrecedente}`,
                sens: resume.data.deltaPeriodePrecedente < 0 ? 'baisse' : 'hausse',
              }}
            />

            <Tuile
              libelle={TABLEAU_DE_BORD.tuiles.projectionFinDeMois}
              valeur={montantCourt(resume.data.projectionFinDeMois)}
              unite={COMMUN.unites.cout}
            >
              <div className={styles.jaugeLigne}>
                <Jauge
                  valeur={resume.data.projectionFinDeMois}
                  plafond={resume.data.plafondGlobal}
                  tonalite={tonaliteJauge}
                  libelleAccessible={TABLEAU_DE_BORD.tuiles.partPlafond(pourcentage(resume.data.partPlafond, 0))}
                />
                <span className={`${styles.jaugeTexte} ${CLASSE_TON_JAUGE[tonaliteJauge]}`}>
                  {TABLEAU_DE_BORD.tuiles.partPlafond(pourcentage(resume.data.partPlafond, 0))}
                </span>
              </div>
            </Tuile>

            <Tuile libelle={TABLEAU_DE_BORD.tuiles.tokensTraites} valeur={tokensMillions(resume.data.tokens)}>
              <MicroCourbe valeurs={resume.data.parJour.map((point) => point.cout)} />
            </Tuile>

            <TuileCache
              libelle={TABLEAU_DE_BORD.tuiles.partCache}
              valeur={pourcentage(resume.data.partCache, 0)}
              montantEvite={montant(resume.data.economieCache)}
              libelleEvites={TABLEAU_DE_BORD.tuiles.evites}
            />
          </div>

          <Panneau titre={chartTitre} sousTitre={TABLEAU_DE_BORD.graphique.aide}>
            <BarresEmpilees
              colonnes={colonnesGraphique}
              max={maxJour}
              libelleAxeHaut={montantCourt(maxJour)}
              libelleAxeMilieu={montantCourt(maxJour / 2)}
              {...(jourSelectionne !== undefined ? { selection: jourSelectionne } : {})}
              onSelection={(cle) => setJourSelectionne((precedent) => (precedent === cle ? undefined : cle))}
              libelleAccessible={chartTitre}
            />
          </Panneau>

          <div className={styles.corpsInferieur}>
            <Panneau
              titre={TABLEAU_DE_BORD.projets.titre}
              actions={
                jourSelectionne !== undefined ? (
                  <div className={styles.filtreJour}>
                    <span className={styles.compteur}>{date(jourSelectionne)}</span>
                    <BoutonFantome onClick={() => setJourSelectionne(undefined)}>{COMMUN.actions.annuler}</BoutonFantome>
                  </div>
                ) : (
                  <span className={styles.compteur}>{TABLEAU_DE_BORD.projets.actifs(projets.data?.length ?? 0)}</span>
                )
              }
            >
              {projets.statut === 'erreur' ? (
                <BandeauErreur message={projets.erreur ?? ERREURS.inattendue} onReessayer={projets.recharger} />
              ) : projets.statut === 'chargement' ? (
                <p className="micro" role="status">
                  {COMMUN.etats.chargement}
                </p>
              ) : (
                <Tableau
                  colonnes={COLONNES_PROJETS}
                  lignes={projets.data ?? []}
                  cleLigne={(ligne) => ligne.projet}
                  messageVide={`${TABLEAU_DE_BORD.projets.videTitre}. ${TABLEAU_DE_BORD.projets.videDetail}`}
                  {...(projetSelectionne !== undefined ? { ligneSelectionneeId: projetSelectionne } : {})}
                  onLigneClic={(ligne) => setProjetSelectionne(ligne.projet)}
                />
              )}
            </Panneau>

            <Panneau>
              {projetActuel ? (
                <div className={styles.detailCorps}>
                  <div>
                    <div className="micro">{TABLEAU_DE_BORD.detailProjet.titre}</div>
                    <div className={styles.detailNom}>{projetActuel.projet}</div>
                  </div>

                  <div className={styles.miniTuiles}>
                    <div className={styles.miniTuile}>
                      <div className="micro">{TABLEAU_DE_BORD.detailProjet.coutLabel}</div>
                      <div className={styles.miniValeur}>{montant(projetActuel.cout)}</div>
                    </div>
                    <div className={styles.miniTuile}>
                      <div className="micro">{TABLEAU_DE_BORD.detailProjet.sessionsLabel}</div>
                      <div className={styles.miniValeur}>{projetActuel.sessions}</div>
                    </div>
                  </div>

                  <RepartitionModele
                    titre={TABLEAU_DE_BORD.detailProjet.repartitionModele}
                    parModele={projetActuel.parModele}
                    total={projetActuel.cout}
                  />

                  <PostesChers titre={TABLEAU_DE_BORD.detailProjet.postesLesPlusChers} postes={projetActuel.postes} />

                  <div className={styles.alerteWrapper}>
                    <Encart tonalite="vigilance" icone={<Icone nom="alerte" taille={15} />}>
                      {projetActuel.alerte}
                    </Encart>
                  </div>
                </div>
              ) : (
                <EtatVide titre={TABLEAU_DE_BORD.projets.videTitre} detail={TABLEAU_DE_BORD.projets.videDetail} />
              )}
            </Panneau>
          </div>
        </>
      )}

      <PiedDePage />
    </Ecran>
  );
}
