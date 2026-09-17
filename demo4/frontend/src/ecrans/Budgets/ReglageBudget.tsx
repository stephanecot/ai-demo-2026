/**
 * ReglageBudget — panneau de droite : réglage du budget sélectionné.
 *
 * Le curseur, les seuils et les canaux modifient un brouillon local. Tant
 * que ce brouillon diffère des valeurs du serveur, Annuler et Enregistrer
 * s'activent. Enregistrer appelle réellement `PATCH /api/budgets/:id` puis
 * rafraîchit les données via `onEnregistre` ; en cas d'échec, le message
 * du backend s'affiche. Le verdict et l'état affichés dans l'encart sont
 * ceux renvoyés par le backend — jamais recalculés côté client.
 */
import { useEffect, useMemo, useState } from 'react';

import { modifieBudget } from '../../api/budgets';
import { BandeauErreur, BoutonFantome, Curseur, Encart, Icone, Interrupteur, Panneau } from '../../components/ui';
import { montant, montantCourt, pourcentage } from '../../format';
import { BUDGETS, COMMUN, ERREURS, ETATS_BUDGET } from '../../labels';
import type { Canal, EtatDuBudget } from '../../types/api';
import { BUDGETS_LOCAL } from './labels.locaux';
import { delaiRelatifJours } from './temps';
import { visuelEtat } from './visuels';
import styles from './ReglageBudget.module.css';

/** Les quatre seuils d'alerte proposés par le produit — fixés par le contrat. */
const SEUILS_DISPONIBLES = [50, 80, 90, 100] as const;

interface Brouillon {
  readonly plafond: number;
  readonly seuils: readonly number[];
  readonly canaux: readonly Canal[];
}

function brouillonDepuis(budget: EtatDuBudget): Brouillon {
  return { plafond: budget.plafond, seuils: budget.seuils, canaux: budget.canaux };
}

function trie(seuils: readonly number[]): number[] {
  return [...seuils].sort((a, b) => a - b);
}

function seuilsEgaux(a: readonly number[], b: readonly number[]): boolean {
  const ta = trie(a);
  const tb = trie(b);
  return ta.length === tb.length && ta.every((valeur, index) => valeur === tb[index]);
}

function canauxEgaux(a: readonly Canal[], b: readonly Canal[]): boolean {
  return a.length === b.length && a.every((canal) => b.find((autre) => autre.id === canal.id)?.actif === canal.actif);
}

export interface ReglageBudgetProps {
  readonly budget: EtatDuBudget;
  /** Relance le chargement des budgets après un enregistrement réussi. */
  readonly onEnregistre: () => void;
}

export function ReglageBudget({ budget, onEnregistre }: ReglageBudgetProps) {
  const [brouillon, setBrouillon] = useState<Brouillon>(() => brouillonDepuis(budget));
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | undefined>(undefined);

  // Resynchronise le brouillon quand le budget affiché change (sélection
  // d'une autre carte, ou nouvelles données après enregistrement/annulation).
  useEffect(() => {
    setBrouillon(brouillonDepuis(budget));
    setErreur(undefined);
  }, [budget]);

  const modifie =
    brouillon.plafond !== budget.plafond ||
    !seuilsEgaux(brouillon.seuils, budget.seuils) ||
    !canauxEgaux(brouillon.canaux, budget.canaux);

  const visuel = visuelEtat(budget.etat);

  const seuilsDeclenches = useMemo(
    () => trie(brouillon.seuils.filter((seuil) => budget.pctProjection >= seuil)),
    [brouillon.seuils, budget.pctProjection],
  );

  function alternerSeuil(valeur: number) {
    setBrouillon((precedent) => ({
      ...precedent,
      seuils: precedent.seuils.includes(valeur)
        ? precedent.seuils.filter((seuil) => seuil !== valeur)
        : [...precedent.seuils, valeur],
    }));
  }

  function alternerCanal(id: Canal['id']) {
    setBrouillon((precedent) => ({
      ...precedent,
      canaux: precedent.canaux.map((canal) => (canal.id === id ? { ...canal, actif: !canal.actif } : canal)),
    }));
  }

  function annuler() {
    setBrouillon(brouillonDepuis(budget));
    setErreur(undefined);
  }

  async function enregistrer() {
    setEnCours(true);
    setErreur(undefined);
    try {
      await modifieBudget(budget.id, {
        plafond: brouillon.plafond,
        seuils: trie(brouillon.seuils),
        // Le backend attend les identifiants des canaux **actifs** : un canal
        // absent de la liste est éteint (cf. `Budget.canaux` du plan, §4.1).
        canaux: brouillon.canaux.filter((canal) => canal.actif).map((canal) => canal.id),
      });
      onEnregistre();
    } catch (cause) {
      setErreur(cause instanceof Error ? cause.message : ERREURS.inattendue);
    } finally {
      setEnCours(false);
    }
  }

  return (
    <Panneau>
      <div className={styles.corps}>
        <div>
          <div className={styles.micro}>{BUDGETS.reglageBudget.titre}</div>
          <div className={styles.nom}>{budget.nom}</div>
        </div>

        <div>
          <div className={styles.ligneLabel}>
            <span className={styles.micro}>{BUDGETS.reglageBudget.plafondMensuel}</span>
            <span className={styles.plafondValeur}>
              {montantCourt(brouillon.plafond)}
              <span className={styles.plafondUnite}>$</span>
            </span>
          </div>
          <Curseur
            min={budget.min}
            max={budget.max}
            pas={budget.pas}
            valeur={brouillon.plafond}
            onChange={(valeur) => setBrouillon((precedent) => ({ ...precedent, plafond: valeur }))}
            valeurAffichee={montant(brouillon.plafond)}
            libelleAccessible={BUDGETS.reglageBudget.curseurAriaLabel}
            libelleDiminuer={BUDGETS.reglageBudget.diminuer}
            libelleAugmenter={BUDGETS.reglageBudget.augmenter}
          />
          <div className={styles.bornes}>
            <span>{montant(budget.min)}</span>
            <span>{montant(budget.max)}</span>
          </div>
        </div>

        <Encart tonalite={visuel.tone} icone={<Icone nom={visuel.icone} taille={15} />}>
          <div className={styles.etatEncart}>{ETATS_BUDGET[budget.etat]}</div>
          <p className={styles.verdict}>{budget.verdict}</p>
          <div className={styles.chiffres}>
            <div>
              <div className={styles.micro}>{BUDGETS.reglageBudget.consomme}</div>
              <div className={styles.chiffreValeur}>{montant(budget.consomme)}</div>
            </div>
            <div>
              <div className={styles.micro}>{BUDGETS.reglageBudget.projection}</div>
              <div className={styles.chiffreValeur}>{montant(budget.projection)}</div>
            </div>
            <div>
              <div className={styles.micro}>{BUDGETS.reglageBudget.reste}</div>
              <div
                className={
                  budget.reste < 0 ? `${styles.chiffreValeur} ${styles.resteDepassement}` : styles.chiffreValeur
                }
              >
                {montant(budget.reste)}
              </div>
            </div>
          </div>
        </Encart>

        <div>
          <div className={styles.microEspace}>{BUDGETS.reglageBudget.alerterA}</div>
          <div className={styles.seuils}>
            {SEUILS_DISPONIBLES.map((seuil) => {
              const actif = brouillon.seuils.includes(seuil);
              return (
                <button
                  key={seuil}
                  type="button"
                  className={actif ? `${styles.seuil} ${styles.seuilActif}` : styles.seuil}
                  aria-pressed={actif}
                  onClick={() => alternerSeuil(seuil)}
                >
                  {pourcentage(seuil, 0)}
                </button>
              );
            })}
          </div>
          <p className={styles.seuilsTexte}>
            {seuilsDeclenches.length === 0
              ? BUDGETS_LOCAL.seuilAucunFranchi
              : BUDGETS_LOCAL.seuilsFranchis(seuilsDeclenches)}
          </p>
        </div>

        <div>
          <div className={styles.microEspace}>{BUDGETS.reglageBudget.canaux}</div>
          <div className={styles.canaux}>
            {brouillon.canaux.map((canal) => (
              <Interrupteur
                key={canal.id}
                actif={canal.actif}
                libelle={canal.libelle}
                detail={canal.detail}
                onChange={() => alternerCanal(canal.id)}
              />
            ))}
          </div>
        </div>

        {erreur && <BandeauErreur message={erreur} />}

        <div className={styles.pied}>
          <span className={styles.modifieLe}>
            {BUDGETS.reglageBudget.modifieLe(delaiRelatifJours(budget.modifieLe), budget.modifiePar)}
          </span>
          <div className={styles.actions}>
            <BoutonFantome disabled={!modifie || enCours} onClick={annuler}>
              {COMMUN.actions.annuler}
            </BoutonFantome>
            <BoutonFantome disabled={!modifie || enCours} onClick={enregistrer}>
              {COMMUN.actions.enregistrer}
            </BoutonFantome>
          </div>
        </div>
      </div>
    </Panneau>
  );
}
