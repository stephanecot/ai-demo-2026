/**
 * Tests de l'écran « Budgets & alertes » (`src/ecrans/Budgets`).
 *
 * Couvre les quatre états du hook `useBudgets`, la sélection d'un budget
 * (clic et clavier), le réglage du plafond (curseur et boutons −/+),
 * le basculement d'un seuil et d'un canal, l'enregistrement (succès et
 * échec) et son annulation, ainsi que l'accessibilité des contrôles.
 *
 * `../../src/api/budgets` est bouchonné : aucun appel réseau réel.
 */
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import Budgets from '../../src/ecrans/Budgets';
import { BUDGETS, COMMUN } from '../../src/labels';
import { montant, montantCourt } from '../../src/format';
import type { Alerte, EtatDuBudget, Sante } from '../../src/types/api';

vi.mock('../../src/api/budgets', () => ({
  recupereBudgets: vi.fn(),
  modifieBudget: vi.fn(),
}));

vi.mock('../../src/api/sante', () => ({
  recupereSante: vi.fn(),
}));

import { modifieBudget, recupereBudgets } from '../../src/api/budgets';
import { recupereSante } from '../../src/api/sante';

const recupereBudgetsMock = vi.mocked(recupereBudgets);
const modifieBudgetMock = vi.mocked(modifieBudget);
const recupereSanteMock = vi.mocked(recupereSante);

const SANTE_EXEMPLE: Sante = {
  statut: 'ok',
  version: '1.0.0',
  source: 'exemple',
  synchro: new Date().toISOString(),
  cycle: { debut: '2026-09-01', fin: '2026-09-30', jour: 10, jours: 30 },
};

function budgetAvv(): EtatDuBudget {
  return {
    id: 'avv',
    nom: 'Équipe AVV',
    portee: 'organisation',
    plafond: 1200,
    seuils: [80, 90],
    min: 400,
    max: 2400,
    pas: 50,
    modifieLe: new Date(Date.now() - 2 * 86_400_000).toISOString(),
    modifiePar: 'stephane',
    consomme: 314,
    projection: 942,
    reste: 886,
    etat: 'a-surveiller',
    seuilsFranchis: [80],
    pctConsomme: 26.2,
    pctProjection: 82,
    verdict:
      'Au rythme actuel, le cycle se termine à 942 $, soit 78 % du plafond. Marge restante : 258 $.',
    canaux: [
      { id: 'mail', libelle: 'E-mail', detail: 'avv-leads@exemple.fr', actif: true },
      { id: 'slack', libelle: 'Slack', detail: '#claude-code-couts', actif: true },
      { id: 'blocage', libelle: 'Blocage dur à 100 %', detail: 'refuse les nouvelles sessions du projet', actif: false },
    ],
  };
}

function budgetSynapse(): EtatDuBudget {
  return {
    id: 'synapse',
    nom: 'synapse',
    portee: 'projet · R&D',
    plafond: 25,
    seuils: [90, 100],
    min: 10,
    max: 150,
    pas: 5,
    modifieLe: new Date().toISOString(),
    modifiePar: 'stephane',
    consomme: 27,
    projection: 31,
    reste: -2.5,
    etat: 'depassement-prevu',
    seuilsFranchis: [90, 100],
    pctConsomme: 100,
    pctProjection: 100,
    verdict: 'Au rythme actuel, le cycle se termine à 31 $, soit 24 % au-dessus du plafond.',
    canaux: [
      { id: 'mail', libelle: 'E-mail', detail: 'avv-leads@exemple.fr', actif: true },
      { id: 'slack', libelle: 'Slack', detail: '#claude-code-couts', actif: false },
      { id: 'blocage', libelle: 'Blocage dur à 100 %', detail: 'refuse les nouvelles sessions du projet', actif: false },
    ],
  };
}

function alertesExemple(): Alerte[] {
  return [
    {
      id: 'a1',
      horodatage: '2026-09-10T09:14:00Z',
      budgetId: 'synapse',
      severite: 'critique',
      texte: 'synapse a franchi 90 % de son plafond.',
    },
    {
      id: 'a2',
      horodatage: '2026-09-09T18:02:00Z',
      budgetId: 'avv',
      severite: 'info',
      texte: 'Équipe AVV : projection révisée à 942 $.',
    },
  ];
}

/** La carte-bouton d'un budget : son nom d'accessibilité contient le nom du budget. */
function carteBudget(nomBudget: string): HTMLElement {
  return screen.getByRole('button', { name: new RegExp(nomBudget) });
}

/**
 * `getByText` normalise le texte du DOM (espaces collapsées) mais pas la
 * chaîne de comparaison : l'espace fine insécable de `format.ts` doit donc
 * être ramenée à une espace normale ici pour que la comparaison aboutisse.
 */
function texte(valeurFormatee: string): string {
  const espaceFineInsecable = String.fromCharCode(0x202f);
  return valeurFormatee.split(espaceFineInsecable).join(" ");
}

/** Rend l'écran et attend que l'état « prêt » soit affiché (panneau de réglage présent). */
async function rendPret() {
  recupereBudgetsMock.mockResolvedValue({ budgets: [budgetAvv(), budgetSynapse()], alertes: alertesExemple() });
  render(<Budgets />);
  await screen.findByText(BUDGETS.reglageBudget.titre);
}

beforeEach(() => {
  recupereSanteMock.mockResolvedValue(SANTE_EXEMPLE);
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('Budgets — les quatre états', () => {
  it('affiche le chargement pendant la requête', () => {
    recupereBudgetsMock.mockReturnValue(new Promise(() => {}));
    render(<Budgets />);
    expect(screen.getByText(COMMUN.etats.chargement)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: BUDGETS.titre })).toBeInTheDocument();
  });

  it("affiche le message d'erreur du backend, jamais un texte générique", async () => {
    recupereBudgetsMock.mockRejectedValue(new Error('Le service de budgets est momentanément indisponible.'));
    render(<Budgets />);
    expect(
      await screen.findByText('Le service de budgets est momentanément indisponible.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: COMMUN.etats.reessayer })).toBeInTheDocument();
  });

  it("affiche l'état vide quand aucun budget n'est configuré", async () => {
    recupereBudgetsMock.mockResolvedValue({ budgets: [], alertes: [] });
    render(<Budgets />);
    expect(await screen.findByText(BUDGETS.videTitre)).toBeInTheDocument();
    expect(screen.getByText(BUDGETS.videDetail)).toBeInTheDocument();
    expect(screen.getByText(BUDGETS.sousTitre(0, 0))).toBeInTheDocument();
  });

  it('affiche les budgets et le compteur de dépassements calculé depuis les données', async () => {
    await rendPret();
    // Un budget sur deux (synapse) est en dépassement prévu.
    expect(screen.getByText(BUDGETS.sousTitre(2, 1))).toBeInTheDocument();
    expect(carteBudget('synapse')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: COMMUN.actions.nouveauBudget })).toBeInTheDocument();
  });
});

describe('Budgets — sélection', () => {
  it('sélectionne le premier budget par défaut et affiche son réglage à droite', async () => {
    await rendPret();
    expect(carteBudget('Équipe AVV')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText(BUDGETS.reglageBudget.titre)).toBeInTheDocument();
    // Le nom du budget sélectionné apparaît aussi dans le panneau de droite.
    expect(screen.getAllByText('Équipe AVV').length).toBeGreaterThanOrEqual(2);
  });

  it('change la sélection au clic sur une autre carte', async () => {
    const utilisateur = userEvent.setup();
    await rendPret();
    const carteSynapse = carteBudget('synapse');
    await utilisateur.click(carteSynapse);
    expect(carteSynapse).toHaveAttribute('aria-pressed', 'true');
    expect(carteBudget('Équipe AVV')).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getAllByText('synapse').length).toBeGreaterThanOrEqual(2);
  });

  it('change la sélection au clavier (une carte est un vrai bouton activable par Entrée)', async () => {
    const utilisateur = userEvent.setup();
    await rendPret();
    const carteSynapse = carteBudget('synapse');
    carteSynapse.focus();
    await utilisateur.keyboard('{Enter}');
    expect(carteSynapse).toHaveAttribute('aria-pressed', 'true');
  });
});

describe('Budgets — réglage du plafond', () => {
  it('règle le plafond au curseur et active Annuler / Enregistrer', async () => {
    await rendPret();
    const curseur = screen.getByLabelText(BUDGETS.reglageBudget.curseurAriaLabel);
    const boutonEnregistrer = screen.getByRole('button', { name: COMMUN.actions.enregistrer });
    const boutonAnnuler = screen.getByRole('button', { name: COMMUN.actions.annuler });
    expect(boutonEnregistrer).toBeDisabled();
    expect(boutonAnnuler).toBeDisabled();

    fireEvent.change(curseur, { target: { value: '1300' } });

    expect(screen.getByText(texte(montantCourt(1300)))).toBeInTheDocument();
    expect(boutonEnregistrer).toBeEnabled();
    expect(boutonAnnuler).toBeEnabled();
  });

  it('règle le plafond aux boutons − et +', async () => {
    const utilisateur = userEvent.setup();
    await rendPret();
    const augmenter = screen.getByRole('button', { name: BUDGETS.reglageBudget.augmenter });
    await utilisateur.click(augmenter);
    // Plafond initial 1200, pas 50 → 1250 après un clic sur « + ».
    expect(screen.getByText(texte(montantCourt(1250)))).toBeInTheDocument();

    const diminuer = screen.getByRole('button', { name: BUDGETS.reglageBudget.diminuer });
    await utilisateur.click(diminuer);
    await utilisateur.click(diminuer);
    // 1250 − 50 − 50 = 1150.
    expect(screen.getByText(texte(montantCourt(1150)))).toBeInTheDocument();
  });

  it('affiche les bornes min et max du curseur', async () => {
    await rendPret();
    expect(screen.getByText(texte(montant(400)))).toBeInTheDocument();
    expect(screen.getByText(texte(montant(2400)))).toBeInTheDocument();
  });
});

describe('Budgets — seuils et canaux', () => {
  it('bascule un seuil et met à jour la phrase de déclenchement', async () => {
    const utilisateur = userEvent.setup();
    await rendPret();
    // Le budget « Équipe AVV » a une projection à 82 % ; le seuil 80 % est
    // déjà actif dans les données et donc franchi.
    expect(screen.getByText(/1 alerte partirait ce cycle/)).toBeInTheDocument();

    const seuil80 = screen.getByRole('button', { name: '80 %' });
    expect(seuil80).toHaveAttribute('aria-pressed', 'true');
    await utilisateur.click(seuil80);

    expect(seuil80).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByText('Aucun seuil franchi par la projection actuelle.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: COMMUN.actions.enregistrer })).toBeEnabled();
  });

  it('bascule un canal et active Enregistrer', async () => {
    const utilisateur = userEvent.setup();
    await rendPret();
    const canalMail = screen.getByRole('switch', { name: /E-mail/ });
    expect(canalMail).toHaveAttribute('aria-checked', 'true');
    await utilisateur.click(canalMail);
    expect(canalMail).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByRole('button', { name: COMMUN.actions.enregistrer })).toBeEnabled();
  });
});

describe('Budgets — enregistrement', () => {
  it('enregistre le brouillon, appelle PATCH puis rafraîchit les données', async () => {
    const utilisateur = userEvent.setup();
    const budgetAvvModifie: EtatDuBudget = { ...budgetAvv(), plafond: 1250 };
    recupereBudgetsMock
      .mockResolvedValueOnce({ budgets: [budgetAvv(), budgetSynapse()], alertes: alertesExemple() })
      .mockResolvedValueOnce({ budgets: [budgetAvvModifie, budgetSynapse()], alertes: alertesExemple() });
    modifieBudgetMock.mockResolvedValue(budgetAvvModifie);

    render(<Budgets />);
    await screen.findByText(BUDGETS.reglageBudget.titre);

    const augmenter = screen.getByRole('button', { name: BUDGETS.reglageBudget.augmenter });
    await utilisateur.click(augmenter);

    const boutonEnregistrer = screen.getByRole('button', { name: COMMUN.actions.enregistrer });
    await utilisateur.click(boutonEnregistrer);

    await waitFor(() => expect(modifieBudgetMock).toHaveBeenCalledTimes(1));
    // `canaux` part sous la forme attendue par le backend : les identifiants
    // des seuls canaux actifs (`blocage` est éteint, il n'apparaît donc pas).
    expect(modifieBudgetMock).toHaveBeenCalledWith('avv', {
      plafond: 1250,
      seuils: [80, 90],
      canaux: ['mail', 'slack'],
    });

    await waitFor(() => expect(recupereBudgetsMock).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(screen.getByRole('button', { name: COMMUN.actions.enregistrer })).toBeDisabled());
  });

  it("affiche le message d'échec du backend et laisse Enregistrer actif", async () => {
    const utilisateur = userEvent.setup();
    modifieBudgetMock.mockRejectedValue(new Error('Le plafond dépasse la borne maximale autorisée.'));
    await rendPret();

    const augmenter = screen.getByRole('button', { name: BUDGETS.reglageBudget.augmenter });
    await utilisateur.click(augmenter);
    const boutonEnregistrer = screen.getByRole('button', { name: COMMUN.actions.enregistrer });
    await utilisateur.click(boutonEnregistrer);

    expect(await screen.findByText('Le plafond dépasse la borne maximale autorisée.')).toBeInTheDocument();
    expect(recupereBudgetsMock).toHaveBeenCalledTimes(1);
    expect(boutonEnregistrer).toBeEnabled();
  });

  it('Annuler restaure les valeurs du serveur', async () => {
    const utilisateur = userEvent.setup();
    await rendPret();

    const augmenter = screen.getByRole('button', { name: BUDGETS.reglageBudget.augmenter });
    await utilisateur.click(augmenter);
    expect(screen.getByText(texte(montantCourt(1250)))).toBeInTheDocument();

    const boutonAnnuler = screen.getByRole('button', { name: COMMUN.actions.annuler });
    await utilisateur.click(boutonAnnuler);

    expect(screen.getByText(texte(montantCourt(1200)))).toBeInTheDocument();
    expect(boutonAnnuler).toBeDisabled();
    expect(screen.getByRole('button', { name: COMMUN.actions.enregistrer })).toBeDisabled();
    expect(modifieBudgetMock).not.toHaveBeenCalled();
  });
});

describe('Budgets — accessibilité', () => {
  it('porte les rôles et libellés accessibles attendus', async () => {
    await rendPret();

    expect(screen.getByLabelText(BUDGETS.reglageBudget.curseurAriaLabel)).toHaveAttribute('type', 'range');
    expect(screen.getAllByRole('progressbar')).toHaveLength(2);

    expect(carteBudget('Équipe AVV')).toHaveAttribute('aria-pressed');

    const seuil90 = screen.getByRole('button', { name: '90 %' });
    expect(seuil90).toHaveAttribute('aria-pressed');

    const canaux = screen.getAllByRole('switch');
    expect(canaux.length).toBeGreaterThan(0);
    for (const canal of canaux) {
      expect(canal).toHaveAttribute('aria-checked');
    }
  });

  it('affiche systématiquement un libellé à côté de la couleur pour la puce d’état', async () => {
    await rendPret();
    // « à surveiller » et « dépassement prévu » sont les libellés des deux
    // budgets de ce jeu de test — jamais la couleur seule.
    expect(within(carteBudget('Équipe AVV')).getByText('à surveiller')).toBeInTheDocument();
    expect(within(carteBudget('synapse')).getByText('dépassement prévu')).toBeInTheDocument();
  });
});
