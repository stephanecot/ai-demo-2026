/**
 * Tests des contrôles et graphiques du design system (partie 2) :
 * Jauge, SegmentControl, Onglets, Interrupteur, Curseur, BoutonPrincipal,
 * BoutonFantome, Encart, MicroCourbe, BarresEmpilees.
 *
 * Pour chaque composant : rendu par défaut, chaque variante, l'état
 * désactivé quand il existe, le pilotage clavier, le rôle et le libellé
 * accessibles.
 */
import { useState } from 'react';

import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import {
  BarresEmpilees,
  BoutonFantome,
  BoutonPrincipal,
  Curseur,
  Encart,
  Interrupteur,
  Jauge,
  MicroCourbe,
  Onglets,
  SegmentControl,
} from '../../src/components/ui';
import type { ColonneBarres, ToneEncart, ToneJauge } from '../../src/components/ui';

// ─── Jauge ───────────────────────────────────────────────────────────────

describe('Jauge', () => {
  it('affiche une barre de progression avec la valeur accessible fournie', () => {
    render(
      <Jauge valeur={62} plafond={100} tonalite="vigilance" libelleAccessible="62 % du plafond" />,
    );
    const jauge = screen.getByRole('progressbar');
    expect(jauge).toHaveAttribute('aria-valuenow', '62');
    expect(jauge).toHaveAttribute('aria-valuetext', '62 % du plafond');
  });

  it.each<ToneJauge>(['ok', 'vigilance', 'limite', 'depassement'])(
    'accepte la tonalité %s sans erreur',
    (tonalite) => {
      render(
        <Jauge valeur={10} plafond={100} tonalite={tonalite} libelleAccessible="10 % du plafond" />,
      );
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    },
  );

  it('borne la valeur à 100 % quand le consommé dépasse le plafond', () => {
    render(
      <Jauge valeur={180} plafond={100} tonalite="depassement" libelleAccessible="dépassement" />,
    );
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
  });

  it('dessine la projection en plus du consommé quand elle est fournie', () => {
    const { container } = render(
      <Jauge
        valeur={40}
        plafond={100}
        projection={90}
        tonalite="ok"
        libelleAccessible="40 % consommés, projection 90 %"
      />,
    );
    // Deux remplissages : le consommé net et la projection fantôme.
    expect(container.querySelectorAll('[style*="width"]')).toHaveLength(2);
  });

  it('ne casse pas quand le plafond vaut zéro', () => {
    render(<Jauge valeur={5} plafond={0} tonalite="ok" libelleAccessible="plafond non défini" />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
  });
});

// ─── SegmentControl ──────────────────────────────────────────────────────

describe('SegmentControl', () => {
  const options = [
    { valeur: '7j', libelle: '7 J' },
    { valeur: '10j', libelle: 'CE MOIS' },
    { valeur: '30j', libelle: '30 J' },
  ] as const;

  it('affiche un groupe de boutons radio, un seul coché', () => {
    render(
      <SegmentControl options={options} valeur="10j" onChange={vi.fn()} libelleAccessible="Période" />,
    );
    const groupe = screen.getByRole('radiogroup', { name: 'Période' });
    const radios = within(groupe).getAllByRole('radio');
    expect(radios).toHaveLength(3);
    expect(screen.getByRole('radio', { name: 'CE MOIS' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: '7 J' })).toHaveAttribute('aria-checked', 'false');
  });

  it('appelle onChange au clic sur un segment', async () => {
    const utilisateur = userEvent.setup();
    const onChange = vi.fn();
    render(
      <SegmentControl options={options} valeur="10j" onChange={onChange} libelleAccessible="Période" />,
    );
    await utilisateur.click(screen.getByRole('radio', { name: '30 J' }));
    expect(onChange).toHaveBeenCalledWith('30j');
  });

  it('se pilote au clavier avec les flèches gauche et droite', async () => {
    // Composant contrôlé : un harnais avec état reproduit un vrai écran, où
    // `valeur` change réellement entre deux appuis de touche.
    function Harnais() {
      const [valeur, setValeur] = useState<(typeof options)[number]['valeur']>('10j');
      return <SegmentControl options={options} valeur={valeur} onChange={setValeur} libelleAccessible="Période" />;
    }
    const utilisateur = userEvent.setup();
    render(<Harnais />);
    screen.getByRole('radio', { name: 'CE MOIS' }).focus();
    await utilisateur.keyboard('{ArrowRight}');
    expect(screen.getByRole('radio', { name: '30 J' })).toHaveAttribute('aria-checked', 'true');
    await utilisateur.keyboard('{ArrowLeft}');
    expect(screen.getByRole('radio', { name: 'CE MOIS' })).toHaveAttribute('aria-checked', 'true');
  });

  it('revient au premier segment avec Home et au dernier avec End', async () => {
    const utilisateur = userEvent.setup();
    const onChange = vi.fn();
    render(
      <SegmentControl options={options} valeur="10j" onChange={onChange} libelleAccessible="Période" />,
    );
    screen.getByRole('radio', { name: 'CE MOIS' }).focus();
    await utilisateur.keyboard('{End}');
    expect(onChange).toHaveBeenLastCalledWith('30j');
    await utilisateur.keyboard('{Home}');
    expect(onChange).toHaveBeenLastCalledWith('7j');
  });
});

// ─── Onglets ─────────────────────────────────────────────────────────────

describe('Onglets', () => {
  const options = [
    { valeur: 'agents', libelle: 'Par agent' },
    { valeur: 'outils', libelle: 'Par outil' },
  ] as const;

  it('affiche un tablist avec l’onglet actif sélectionné', () => {
    render(<Onglets options={options} valeur="agents" onChange={vi.fn()} libelleAccessible="Vue" />);
    expect(screen.getByRole('tablist', { name: 'Vue' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Par agent' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Par outil' })).toHaveAttribute('aria-selected', 'false');
  });

  it('change d’onglet au clic', async () => {
    const utilisateur = userEvent.setup();
    const onChange = vi.fn();
    render(<Onglets options={options} valeur="agents" onChange={onChange} libelleAccessible="Vue" />);
    await utilisateur.click(screen.getByRole('tab', { name: 'Par outil' }));
    expect(onChange).toHaveBeenCalledWith('outils');
  });

  it('se pilote au clavier avec les flèches', async () => {
    const utilisateur = userEvent.setup();
    const onChange = vi.fn();
    render(<Onglets options={options} valeur="agents" onChange={onChange} libelleAccessible="Vue" />);
    screen.getByRole('tab', { name: 'Par agent' }).focus();
    await utilisateur.keyboard('{ArrowRight}');
    expect(onChange).toHaveBeenCalledWith('outils');
  });

  it('revient au premier onglet avec Home et au dernier avec End', async () => {
    const utilisateur = userEvent.setup();
    const onChange = vi.fn();
    render(<Onglets options={options} valeur="agents" onChange={onChange} libelleAccessible="Vue" />);
    screen.getByRole('tab', { name: 'Par agent' }).focus();
    await utilisateur.keyboard('{End}');
    expect(onChange).toHaveBeenLastCalledWith('outils');
    await utilisateur.keyboard('{Home}');
    expect(onChange).toHaveBeenLastCalledWith('agents');
  });
});

// ─── Interrupteur ────────────────────────────────────────────────────────

describe('Interrupteur', () => {
  it('porte le rôle switch et reflète son état', () => {
    render(<Interrupteur actif libelle="E-mail" detail="avv-leads@exemple.fr" onChange={vi.fn()} />);
    const interrupteur = screen.getByRole('switch', { name: /E-mail/ });
    expect(interrupteur).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByText('avv-leads@exemple.fr')).toBeInTheDocument();
  });

  it('affiche l’état inactif', () => {
    render(<Interrupteur actif={false} libelle="Slack" onChange={vi.fn()} />);
    expect(screen.getByRole('switch', { name: 'Slack' })).toHaveAttribute('aria-checked', 'false');
  });

  it('appelle onChange avec la valeur inversée au clic sur le libellé', async () => {
    const utilisateur = userEvent.setup();
    const onChange = vi.fn();
    render(<Interrupteur actif={false} libelle="Blocage dur" onChange={onChange} />);
    await utilisateur.click(screen.getByRole('switch', { name: 'Blocage dur' }));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('se pilote au clavier avec Entrée et Espace', async () => {
    const utilisateur = userEvent.setup();
    const onChange = vi.fn();
    render(<Interrupteur actif={false} libelle="Slack" onChange={onChange} />);
    screen.getByRole('switch', { name: 'Slack' }).focus();
    await utilisateur.keyboard('{Enter}');
    expect(onChange).toHaveBeenCalledWith(true);
    await utilisateur.keyboard(' ');
    expect(onChange).toHaveBeenCalledTimes(2);
  });
});

// ─── Curseur ─────────────────────────────────────────────────────────────

describe('Curseur', () => {
  it('affiche la glissière, la valeur chiffrée et les boutons -/+', () => {
    render(
      <Curseur
        min={100}
        max={900}
        pas={25}
        valeur={400}
        onChange={vi.fn()}
        valeurAffichee="400 $"
        libelleAccessible="Plafond mensuel"
        libelleDiminuer="Diminuer le plafond"
        libelleAugmenter="Augmenter le plafond"
      />,
    );
    expect(screen.getByRole('slider', { name: 'Plafond mensuel' })).toHaveValue('400');
    expect(screen.getByText('400 $')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Diminuer le plafond' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Augmenter le plafond' })).toBeInTheDocument();
  });

  it('incrémente et décrémente par pas au clic sur les boutons', async () => {
    const utilisateur = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Curseur
        min={100}
        max={900}
        pas={25}
        valeur={400}
        onChange={onChange}
        valeurAffichee="400 $"
        libelleAccessible="Plafond mensuel"
        libelleDiminuer="Diminuer le plafond"
        libelleAugmenter="Augmenter le plafond"
      />,
    );
    await utilisateur.click(screen.getByRole('button', { name: 'Augmenter le plafond' }));
    expect(onChange).toHaveBeenCalledWith(425);
    await utilisateur.click(screen.getByRole('button', { name: 'Diminuer le plafond' }));
    expect(onChange).toHaveBeenCalledWith(375);
  });

  it('désactive les boutons -/+ aux bornes', () => {
    render(
      <Curseur
        min={100}
        max={900}
        pas={25}
        valeur={900}
        onChange={vi.fn()}
        valeurAffichee="900 $"
        libelleAccessible="Plafond mensuel"
        libelleDiminuer="Diminuer le plafond"
        libelleAugmenter="Augmenter le plafond"
      />,
    );
    expect(screen.getByRole('button', { name: 'Augmenter le plafond' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Diminuer le plafond' })).toBeEnabled();
  });
});

// ─── BoutonPrincipal ─────────────────────────────────────────────────────

describe('BoutonPrincipal', () => {
  it('affiche son contenu et répond au clic', async () => {
    const utilisateur = userEvent.setup();
    const onClick = vi.fn();
    render(<BoutonPrincipal onClick={onClick}>Enregistrer</BoutonPrincipal>);
    const bouton = screen.getByRole('button', { name: 'Enregistrer' });
    await utilisateur.click(bouton);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('peut être désactivé', async () => {
    const utilisateur = userEvent.setup();
    const onClick = vi.fn();
    render(
      <BoutonPrincipal onClick={onClick} disabled>
        Enregistrer
      </BoutonPrincipal>,
    );
    const bouton = screen.getByRole('button', { name: 'Enregistrer' });
    expect(bouton).toBeDisabled();
    await utilisateur.click(bouton);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('affiche une icône décorative quand elle est fournie', () => {
    const { container } = render(
      <BoutonPrincipal icone={<svg aria-hidden="true" />}>Nouveau budget</BoutonPrincipal>,
    );
    expect(container.querySelector('svg')).toBeInTheDocument();
  });
});

// ─── BoutonFantome ───────────────────────────────────────────────────────

describe('BoutonFantome', () => {
  it('affiche son contenu et répond au clic', async () => {
    const utilisateur = userEvent.setup();
    const onClick = vi.fn();
    render(<BoutonFantome onClick={onClick}>Exporter CSV</BoutonFantome>);
    await utilisateur.click(screen.getByRole('button', { name: 'Exporter CSV' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('peut être désactivé', () => {
    render(<BoutonFantome disabled>Annuler</BoutonFantome>);
    expect(screen.getByRole('button', { name: 'Annuler' })).toBeDisabled();
  });

  it('affiche une icône décorative quand elle est fournie', () => {
    const { container } = render(
      <BoutonFantome icone={<svg aria-hidden="true" />}>Exporter CSV</BoutonFantome>,
    );
    expect(container.querySelector('svg')).toBeInTheDocument();
  });
});

// ─── Encart ──────────────────────────────────────────────────────────────

describe('Encart', () => {
  it('affiche l’icône et le texte du verdict', () => {
    render(
      <Encart tonalite="vigilance" icone={<svg aria-hidden="true" />}>
        Budget à 78 % du plafond.
      </Encart>,
    );
    expect(screen.getByRole('note')).toHaveTextContent('Budget à 78 % du plafond.');
  });

  it.each<ToneEncart>(['ok', 'vigilance', 'limite', 'depassement'])(
    'accepte la tonalité %s sans erreur',
    (tonalite) => {
      render(
        <Encart tonalite={tonalite} icone={<svg aria-hidden="true" />}>
          Message
        </Encart>,
      );
      expect(screen.getByRole('note')).toBeInTheDocument();
    },
  );
});

// ─── MicroCourbe ─────────────────────────────────────────────────────────

describe('MicroCourbe', () => {
  it('se rend sans axe ni point, et reste décorative', () => {
    const { container } = render(<MicroCourbe valeurs={[1, 4, 2, 8, 3]} />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(container.querySelector('polyline')).toHaveAttribute('points');
    expect(container.querySelectorAll('circle')).toHaveLength(0);
  });

  it('ne casse pas avec moins de deux valeurs', () => {
    const { container } = render(<MicroCourbe valeurs={[5]} />);
    expect(container.querySelector('svg')).toBeInTheDocument();
    expect(container.querySelector('polyline')).not.toBeInTheDocument();
  });

  it('accepte une couleur de série fournie par l’écran', () => {
    const { container } = render(<MicroCourbe valeurs={[1, 2, 3]} couleur="#3987e5" />);
    expect(container.querySelector('polyline')).toHaveAttribute('stroke', '#3987e5');
  });
});

// ─── BarresEmpilees ──────────────────────────────────────────────────────

function colonnesDemo(): readonly ColonneBarres[] {
  return [
    {
      cle: '01',
      libelleAxe: '01',
      libelleEntete: '01 sept · 25,7 $',
      segments: [
        { cle: 'opus', libelle: 'Opus 5', couleur: '#d95926', valeur: 18.4, valeurAffichee: '18,4 $' },
        { cle: 'sonnet', libelle: 'Sonnet 5', couleur: '#3987e5', valeur: 6.2, valeurAffichee: '6,2 $' },
        { cle: 'haiku', libelle: 'Haiku 4.5', couleur: '#199e70', valeur: 1.1, valeurAffichee: '1,1 $' },
      ],
    },
    {
      cle: '02',
      libelleAxe: '02',
      libelleEntete: '02 sept · 31,6 $',
      segments: [
        { cle: 'opus', libelle: 'Opus 5', couleur: '#d95926', valeur: 22.9, valeurAffichee: '22,9 $' },
        { cle: 'sonnet', libelle: 'Sonnet 5', couleur: '#3987e5', valeur: 7.8, valeurAffichee: '7,8 $' },
        { cle: 'haiku', libelle: 'Haiku 4.5', couleur: '#199e70', valeur: 0.9, valeurAffichee: '0,9 $' },
      ],
    },
  ];
}

describe('BarresEmpilees', () => {
  it('affiche une colonne par jour et la légende dès deux séries', () => {
    render(
      <BarresEmpilees
        colonnes={colonnesDemo()}
        max={42}
        libelleAxeHaut="42"
        libelleAxeMilieu="21"
        selection="01"
        onSelection={vi.fn()}
        libelleAccessible="Coût quotidien par modèle"
      />,
    );
    const graphique = screen.getByRole('listbox', { name: 'Coût quotidien par modèle' });
    expect(within(graphique).getAllByRole('option')).toHaveLength(2);
    expect(screen.getAllByText('Opus 5').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Sonnet 5').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Haiku 4.5').length).toBeGreaterThan(0);
  });

  it('ne montre pas de légende avec une seule série', () => {
    const colonneUnique = [
      {
        cle: '01',
        libelleAxe: '01',
        libelleEntete: '01 sept · 18,4 $',
        segments: [
          { cle: 'opus', libelle: 'Opus 5', couleur: '#d95926', valeur: 18.4, valeurAffichee: '18,4 $' },
        ],
      },
    ];
    const { container } = render(
      <BarresEmpilees
        colonnes={colonneUnique}
        max={20}
        libelleAxeHaut="20"
        libelleAxeMilieu="10"
        libelleAccessible="Coût quotidien"
      />,
    );
    expect(container.querySelector('ul')).not.toBeInTheDocument();
  });

  it('marque la colonne sélectionnée avec aria-selected', () => {
    render(
      <BarresEmpilees
        colonnes={colonnesDemo()}
        max={42}
        libelleAxeHaut="42"
        libelleAxeMilieu="21"
        selection="02"
        onSelection={vi.fn()}
        libelleAccessible="Coût quotidien par modèle"
      />,
    );
    const options = screen.getAllByRole('option');
    expect(options[0]).toHaveAttribute('aria-selected', 'false');
    expect(options[1]).toHaveAttribute('aria-selected', 'true');
  });

  it('sélectionne une colonne au clic', async () => {
    const utilisateur = userEvent.setup();
    const onSelection = vi.fn();
    render(
      <BarresEmpilees
        colonnes={colonnesDemo()}
        max={42}
        libelleAxeHaut="42"
        libelleAxeMilieu="21"
        selection="01"
        onSelection={onSelection}
        libelleAccessible="Coût quotidien par modèle"
      />,
    );
    await utilisateur.click(screen.getAllByRole('option')[1] as HTMLElement);
    expect(onSelection).toHaveBeenCalledWith('02');
  });

  it('se pilote au clavier avec les flèches gauche et droite', async () => {
    // Composant contrôlé : un harnais avec état reproduit un vrai écran, où
    // `selection` change réellement entre deux appuis de touche.
    function Harnais() {
      const [selection, setSelection] = useState('01');
      return (
        <BarresEmpilees
          colonnes={colonnesDemo()}
          max={42}
          libelleAxeHaut="42"
          libelleAxeMilieu="21"
          selection={selection}
          onSelection={setSelection}
          libelleAccessible="Coût quotidien par modèle"
        />
      );
    }
    const utilisateur = userEvent.setup();
    render(<Harnais />);
    const options = screen.getAllByRole('option');
    (options[0] as HTMLElement).focus();
    await utilisateur.keyboard('{ArrowRight}');
    expect(screen.getAllByRole('option')[1]).toHaveAttribute('aria-selected', 'true');
    await utilisateur.keyboard('{ArrowLeft}');
    expect(screen.getAllByRole('option')[0]).toHaveAttribute('aria-selected', 'true');
  });

  it('revient à la première colonne avec Home et à la dernière avec End', async () => {
    function Harnais() {
      const [selection, setSelection] = useState('01');
      return (
        <BarresEmpilees
          colonnes={colonnesDemo()}
          max={42}
          libelleAxeHaut="42"
          libelleAxeMilieu="21"
          selection={selection}
          onSelection={setSelection}
          libelleAccessible="Coût quotidien par modèle"
        />
      );
    }
    const utilisateur = userEvent.setup();
    render(<Harnais />);
    (screen.getAllByRole('option')[0] as HTMLElement).focus();
    await utilisateur.keyboard('{End}');
    expect(screen.getAllByRole('option')[1]).toHaveAttribute('aria-selected', 'true');
    await utilisateur.keyboard('{Home}');
    expect(screen.getAllByRole('option')[0]).toHaveAttribute('aria-selected', 'true');
  });

  it('donne le détail par modèle dans l’infobulle', () => {
    render(
      <BarresEmpilees
        colonnes={colonnesDemo()}
        max={42}
        libelleAxeHaut="42"
        libelleAxeMilieu="21"
        selection="01"
        onSelection={vi.fn()}
        libelleAccessible="Coût quotidien par modèle"
      />,
    );
    expect(screen.getByText('01 sept · 25,7 $')).toBeInTheDocument();
    expect(screen.getByText('18,4 $')).toBeInTheDocument();
  });
});
