/**
 * Écran « Budgets & alertes » (`design/Budgets.dc.html`).
 *
 * Colonne de gauche : une carte par budget puis les alertes récentes.
 * Colonne de droite : le réglage du budget sélectionné. Les quatre états
 * du hook `useBudgets` sont traités ; aucun tarif ni calcul de coût ici —
 * tout ce qui s'affiche vient déjà calculé du backend.
 */
import { useEffect, useState } from 'react';

import { Ecran } from '../../components/mise-en-page/Ecran';
import { EnTeteEcran } from '../../components/mise-en-page/EnTeteEcran';
import { PiedDePage } from '../../components/mise-en-page/PiedDePage';
import { BandeauErreur, BoutonPrincipal, EtatVide, Icone } from '../../components/ui';
import { useBudgets } from '../../hooks/useBudgets';
import { BUDGETS, COMMUN } from '../../labels';
import { CarteBudget } from './CarteBudget';
import { PanneauAlertes } from './PanneauAlertes';
import { ReglageBudget } from './ReglageBudget';
import styles from './Budgets.module.css';

function ActionNouveauBudget() {
  return <BoutonPrincipal icone={<Icone nom="plus" taille={14} />}>{COMMUN.actions.nouveauBudget}</BoutonPrincipal>;
}

export default function Budgets() {
  const { data, statut, erreur, recharger } = useBudgets();
  const [selectionId, setSelectionId] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (data && data.budgets.length > 0 && !data.budgets.some((budget) => budget.id === selectionId)) {
      setSelectionId(data.budgets[0]?.id);
    }
  }, [data, selectionId]);

  if (statut === 'chargement') {
    return (
      <Ecran>
        <EnTeteEcran microLabel={COMMUN.etats.chargement} titre={BUDGETS.titre} actions={<ActionNouveauBudget />} />
        <PiedDePage />
      </Ecran>
    );
  }

  if (statut === 'erreur') {
    return (
      <Ecran>
        <EnTeteEcran microLabel={COMMUN.etats.erreurTitre} titre={BUDGETS.titre} actions={<ActionNouveauBudget />} />
        <BandeauErreur message={erreur ?? COMMUN.etats.erreurTitre} onReessayer={recharger} />
        <PiedDePage />
      </Ecran>
    );
  }

  if (!data || statut === 'vide') {
    return (
      <Ecran>
        <EnTeteEcran microLabel={BUDGETS.sousTitre(0, 0)} titre={BUDGETS.titre} actions={<ActionNouveauBudget />} />
        <EtatVide titre={BUDGETS.videTitre} detail={BUDGETS.videDetail} />
        <PiedDePage />
      </Ecran>
    );
  }

  const budgetSelectionne = data.budgets.find((budget) => budget.id === selectionId) ?? data.budgets[0];
  const depassements = data.budgets.filter((budget) => budget.etat === 'depassement-prevu').length;

  return (
    <Ecran>
      <EnTeteEcran
        microLabel={BUDGETS.sousTitre(data.budgets.length, depassements)}
        titre={BUDGETS.titre}
        actions={<ActionNouveauBudget />}
      />
      <div className={styles.grille}>
        <div className={styles.colonneGauche}>
          {data.budgets.map((budget) => (
            <CarteBudget
              key={budget.id}
              budget={budget}
              selectionne={budget.id === budgetSelectionne?.id}
              onSelectionner={() => setSelectionId(budget.id)}
            />
          ))}
          <PanneauAlertes alertes={data.alertes} />
        </div>
        {budgetSelectionne && <ReglageBudget budget={budgetSelectionne} onEnregistre={recharger} />}
      </div>
      <p className={styles.mention}>{BUDGETS.mentionProjection}</p>
      <PiedDePage />
    </Ecran>
  );
}
