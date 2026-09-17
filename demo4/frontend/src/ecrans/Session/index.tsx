/**
 * Session — le détail d'une session, reproduit `design/Session.dc.html`
 * (§ mission react-dev). Quatre états : chargement, prêt, vide (session sans
 * aucun tour) et erreur — un identifiant inconnu remonte en 404 depuis
 * `useSession`, affiché avec le message du backend, jamais un texte générique.
 */
import { useEffect, useMemo, useState } from 'react';

import { useParams } from 'react-router-dom';

import { Ecran } from '../../components/mise-en-page/Ecran';
import { PiedDePage } from '../../components/mise-en-page/PiedDePage';
import { Badge, BandeauErreur, BoutonFantome, EtatVide, Icone, Onglets, Panneau, Tuile } from '../../components/ui';
import type { OptionOnglet } from '../../components/ui';
import { date as formateDate, heure as formateHeure, montant, montantCourt, pourcentage, tokensMillions } from '../../format';
import { useReglages } from '../../hooks/useReglages';
import { useSession } from '../../hooks/useSession';
import { COMMUN, MODELES_ET_AGENTS, SESSION } from '../../labels';
import type { ModeleId, Tarif } from '../../types/api';
import { BarresHorizontales } from './BarresHorizontales';
import { CourbeCumulee } from './CourbeCumulee';
import styles from './Session.module.css';
import { TableauTours } from './TableauTours';

type CleVue = 'tours' | 'outils' | 'agents';

const OPTIONS_VUE: readonly OptionOnglet<CleVue>[] = [
  { valeur: 'tours', libelle: SESSION.onglets.tours },
  { valeur: 'outils', libelle: SESSION.onglets.outils },
  { valeur: 'agents', libelle: SESSION.onglets.agents },
];

export default function Session() {
  const { id = '' } = useParams<{ id: string }>();
  const session = useSession(id);
  const reglages = useReglages();

  const [vue, setVue] = useState<CleVue>('tours');
  const [ouvert, setOuvert] = useState<number | undefined>(undefined);
  const [tourSelectionne, setTourSelectionne] = useState<number | undefined>(undefined);

  // Un nouvel identifiant de session repart d'un panneau fermé et du
  // dernier tour sélectionné, même si le composant reste monté par le
  // routeur (même route, paramètre différent).
  useEffect(() => {
    setVue('tours');
    setOuvert(undefined);
    setTourSelectionne(undefined);
  }, [id]);

  const tarifsParModele = useMemo<ReadonlyMap<ModeleId, Tarif> | undefined>(() => {
    if (!reglages.data) {
      return undefined;
    }
    return new Map(reglages.data.modeles.map((entree) => [entree.modele, entree.tarif] as const));
  }, [reglages.data]);

  if (session.statut === 'chargement') {
    return (
      <Ecran>
        <p className={styles.chargement} role="status">
          {COMMUN.etats.chargement}
        </p>
      </Ecran>
    );
  }

  if (session.statut === 'erreur') {
    return (
      <Ecran>
        <BandeauErreur
          message={session.erreur ?? COMMUN.etats.erreurTitre}
          onReessayer={session.recharger}
          libelleReessayer={COMMUN.etats.reessayer}
        />
      </Ecran>
    );
  }

  const detail = session.data;

  if (!detail || detail.detailTours.length === 0) {
    return (
      <Ecran>
        <EtatVide titre={SESSION.videTitre} detail={SESSION.videDetail} />
      </Ecran>
    );
  }

  const tours = detail.detailTours;
  const indexSelection = Math.min(tourSelectionne ?? tours.length - 1, tours.length - 1);
  const cumules = tours.map((tour) => tour.coutCumule);
  const libellesPoints = tours.map(
    (tour, index) => SESSION.graphique.tourSelectionne(index + 1, montantCourt(tour.coutCumule)),
  );

  const entreesOutils = detail.parOutil.map((ligne) => ({
    cle: ligne.outil,
    libelle: ligne.outil,
    appels: ligne.appels,
    cout: ligne.cout,
  }));
  const entreesAgents = detail.parAgent.map((ligne) => ({
    cle: ligne.agent,
    libelle: ligne.agent,
    appels: ligne.appels,
    cout: ligne.cout,
  }));
  const libelleAppels = (appels: number) => `${appels} ${MODELES_ET_AGENTS.colonneAppels.toLowerCase()}`;

  const compteur = `${detail.tours} ${SESSION.tuiles.tours.toLowerCase()} · ${montant(detail.cout)}`;
  const metadonnees = `${detail.projet} · branche ${detail.branche} · ${formateDate(detail.debut)}, ${formateHeure(detail.debut)} → ${formateHeure(detail.fin)}`;

  return (
    <Ecran>
      <div className={styles.entete}>
        <div className={styles.enteteTitres}>
          <div className={styles.enteteMicro}>
            <span className={styles.microLabel}>{SESSION.microLabel}</span>
            <span className={styles.idSession}>{detail.id}</span>
            <Badge tonalite="etat-ok">{SESSION.chipTerminee}</Badge>
          </div>
          <h1 className={styles.titre}>{detail.branche}</h1>
          <p className={styles.metadonnees}>{metadonnees}</p>
        </div>
        <div className={styles.enteteActions}>
          <BoutonFantome icone={<Icone nom="menu" taille={14} />}>{COMMUN.actions.ouvrirTranscript}</BoutonFantome>
          <BoutonFantome icone={<Icone nom="export" taille={14} />}>{COMMUN.actions.exporter}</BoutonFantome>
        </div>
      </div>

      <div className={styles.tuiles}>
        <Tuile libelle={SESSION.tuiles.coutSession} valeur={montantCourt(detail.cout)} unite={COMMUN.unites.cout} tonalite="accent" />
        <Tuile libelle={SESSION.tuiles.tours} valeur={String(detail.tours)} />
        <Tuile libelle={SESSION.tuiles.tokens} valeur={tokensMillions(detail.tokens)} />
        <Tuile libelle={SESSION.tuiles.cache} valeur={pourcentage(detail.partCache, 0)} tonalite="etat-ok" />
        <Tuile
          libelle={SESSION.tuiles.coutMoyenParTour}
          valeur={montantCourt(detail.cout / Math.max(1, detail.tours))}
          unite={COMMUN.unites.cout}
        />
      </div>

      <Panneau
        titre={SESSION.graphique.titre}
        actions={<span className={styles.selectionTexte}>{libellesPoints[indexSelection]}</span>}
      >
        <CourbeCumulee
          valeurs={cumules}
          selection={indexSelection}
          onSelection={setTourSelectionne}
          libellesPoints={libellesPoints}
          libelleAccessible={SESSION.graphique.titre}
        />
      </Panneau>

      <Panneau>
        <div className={styles.entetePanneauOnglets}>
          <Onglets
            options={OPTIONS_VUE}
            valeur={vue}
            onChange={setVue}
            libelleAccessible={`${SESSION.microLabel} ${detail.id}`}
          />
          <span className={styles.compteur}>{compteur}</span>
        </div>

        {vue === 'tours' && (
          <TableauTours tours={tours} ouvert={ouvert} onBasculer={(index) => setOuvert(ouvert === index ? undefined : index)} tarifs={tarifsParModele} />
        )}
        {vue === 'outils' && <BarresHorizontales entrees={entreesOutils} libelleAppels={libelleAppels} />}
        {vue === 'agents' && <BarresHorizontales entrees={entreesAgents} libelleAppels={libelleAppels} />}
      </Panneau>

      <PiedDePage />
    </Ecran>
  );
}
