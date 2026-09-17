/**
 * Design system, partie 1 — structure et données.
 *
 * Rendu par défaut, variantes, cas vide/désactivé, rôle et libellé
 * accessibles pour : Panneau, Tuile, Badge, Pastille, Tableau, EtatVide,
 * BandeauErreur, Icone.
 *
 * Import direct des fichiers (pas du barrel `index.ts`) : le barrel exporte
 * aussi les composants de l'agent « design system, partie 2 », dont
 * certains peuvent ne pas encore exister pendant le développement en
 * parallèle.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { BandeauErreur } from '../../src/components/ui/BandeauErreur';
import { Badge } from '../../src/components/ui/Badge';
import { EtatVide } from '../../src/components/ui/EtatVide';
import { Icone } from '../../src/components/ui/Icone';
import { Panneau } from '../../src/components/ui/Panneau';
import { Pastille } from '../../src/components/ui/Pastille';
import { Tableau } from '../../src/components/ui/Tableau';
import type { ColonneTableau } from '../../src/components/ui/Tableau';
import { Tuile } from '../../src/components/ui/Tuile';

describe('Panneau', () => {
  it('rend ses enfants sans en-tête quand ni titre ni actions ne sont fournis', () => {
    render(<Panneau>contenu du panneau</Panneau>);
    expect(screen.getByText('contenu du panneau')).toBeInTheDocument();
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  it('rend le titre, le sous-titre et les actions quand ils sont fournis', () => {
    render(
      <Panneau titre="Projets" sousTitre="6 actifs" actions={<button type="button">Exporter</button>}>
        contenu
      </Panneau>,
    );
    expect(screen.getByRole('heading', { name: 'Projets' })).toBeInTheDocument();
    expect(screen.getByText('6 actifs')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Exporter' })).toBeInTheDocument();
  });
});

describe('Tuile', () => {
  it('rend le libellé, la valeur et l’unité', () => {
    render(<Tuile libelle="Coût du mois" valeur="127,40" unite="$" />);
    expect(screen.getByText('Coût du mois')).toBeInTheDocument();
    expect(screen.getByText('127,40')).toBeInTheDocument();
    expect(screen.getByText('$')).toBeInTheDocument();
  });

  it('rend un delta en hausse avec sa flèche et son signe', () => {
    render(
      <Tuile
        libelle="Coût du mois"
        valeur="127,40"
        delta={{ texte: '+18,4 % vs période précédente', sens: 'hausse', tonalite: 'etat-limite' }}
      />,
    );
    expect(screen.getByText('+18,4 % vs période précédente')).toBeInTheDocument();
  });

  it('rend un delta en baisse', () => {
    render(<Tuile libelle="Tokens" valeur="44,8" delta={{ texte: '-4,1 %', sens: 'baisse' }} />);
    expect(screen.getByText('-4,1 %')).toBeInTheDocument();
  });

  it('rend la zone enfant réservée à une jauge ou une micro-courbe', () => {
    render(
      <Tuile libelle="Part cache" valeur="72">
        <div data-testid="zone-enfant">jauge</div>
      </Tuile>,
    );
    expect(screen.getByTestId('zone-enfant')).toBeInTheDocument();
  });

  it('ne rend pas de delta ni d’enfant quand ils sont absents', () => {
    render(<Tuile libelle="Tours" valeur="14" />);
    expect(screen.queryByText(/vs/)).not.toBeInTheDocument();
  });
});

describe('Badge', () => {
  it.each([
    ['neutre', 'principal'],
    ['modele-opus', 'Opus 5'],
    ['modele-sonnet', 'Sonnet 5'],
    ['modele-haiku', 'Haiku 4.5'],
    ['modele-autres', 'Autres'],
    ['etat-ok', 'dans le budget'],
    ['etat-vigilance', 'à surveiller'],
    ['etat-limite', 'limite atteinte'],
    ['etat-depassement', 'dépassement prévu'],
  ] as const)('affiche la couleur et le libellé pour la tonalité %s', (tonalite, libelle) => {
    render(<Badge tonalite={tonalite}>{libelle}</Badge>);
    expect(screen.getByText(libelle)).toBeInTheDocument();
  });

  it('rend une icône quand elle est fournie', () => {
    render(
      <Badge tonalite="etat-ok" icone="coche">
        dans le budget
      </Badge>,
    );
    const badge = screen.getByText('dans le budget').parentElement;
    expect(badge?.querySelector('svg')).toBeInTheDocument();
  });
});

describe('Pastille', () => {
  it('applique la couleur et la taille par défaut', () => {
    render(<Pastille couleur="var(--modele-opus)" />);
    const pastille = document.querySelector('[aria-hidden="true"]');
    expect(pastille).toHaveStyle({ backgroundColor: 'var(--modele-opus)', width: '8px', height: '8px' });
  });

  it('accepte une taille personnalisée', () => {
    render(<Pastille couleur="var(--modele-sonnet)" taille={9} />);
    const pastille = document.querySelector('[aria-hidden="true"]');
    expect(pastille).toHaveStyle({ width: '9px', height: '9px' });
  });
});

interface LigneTest {
  readonly id: string;
  readonly nom: string;
  readonly cout: number;
}

const colonnesTest: readonly ColonneTableau<LigneTest>[] = [
  { cle: 'nom', libelle: 'Projet', rendu: (ligne) => ligne.nom },
  { cle: 'cout', libelle: 'Coût $', numerique: true, rendu: (ligne) => ligne.cout.toString() },
];

const lignesTest: readonly LigneTest[] = [
  { id: 'a', nom: 'gcmt-backend-simulation', cout: 112 },
  { id: 'b', nom: 'enerflex-demo3', cout: 68 },
];

describe('Tableau', () => {
  it('rend les en-têtes en micro-label et les cellules des lignes', () => {
    render(<Tableau colonnes={colonnesTest} lignes={lignesTest} cleLigne={(l) => l.id} messageVide="Aucune donnée." />);
    expect(screen.getByRole('columnheader', { name: 'Projet' })).toBeInTheDocument();
    expect(screen.getByText('gcmt-backend-simulation')).toBeInTheDocument();
    expect(screen.getByText('112')).toBeInTheDocument();
  });

  it('affiche le message vide et aucune ligne quand la liste est vide', () => {
    render(<Tableau colonnes={colonnesTest} lignes={[]} cleLigne={(l) => l.id} messageVide="Aucun projet sur la période." />);
    expect(screen.getByText('Aucun projet sur la période.')).toBeInTheDocument();
    expect(screen.queryByRole('cell')).not.toBeInTheDocument();
  });

  it('rend une ligne cliquable comme un bouton atteignable au clavier', async () => {
    const utilisateur = userEvent.setup();
    const onLigneClic = vi.fn();
    render(
      <Tableau
        colonnes={colonnesTest}
        lignes={lignesTest}
        cleLigne={(l) => l.id}
        messageVide="Aucune donnée."
        onLigneClic={onLigneClic}
      />,
    );
    const lignes = screen.getAllByRole('button');
    expect(lignes).toHaveLength(2);
    expect(lignes[0]).toHaveAttribute('tabIndex', '0');

    await utilisateur.click(lignes[0] as HTMLElement);
    expect(onLigneClic).toHaveBeenCalledWith(lignesTest[0]);

    (lignes[1] as HTMLElement).focus();
    await utilisateur.keyboard('{Enter}');
    expect(onLigneClic).toHaveBeenCalledWith(lignesTest[1]);

    await utilisateur.keyboard(' ');
    expect(onLigneClic).toHaveBeenCalledTimes(3);
  });

  it('ne rend pas de lignes cliquables sans onLigneClic', () => {
    render(<Tableau colonnes={colonnesTest} lignes={lignesTest} cleLigne={(l) => l.id} messageVide="Aucune donnée." />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('porte le liseré de sélection sur la ligne désignée', () => {
    render(
      <Tableau
        colonnes={colonnesTest}
        lignes={lignesTest}
        cleLigne={(l) => l.id}
        messageVide="Aucune donnée."
        ligneSelectionneeId="b"
        onLigneClic={() => {}}
      />,
    );
    const ligneSelectionnee = screen.getByText('enerflex-demo3').closest('[role="button"]');
    expect(ligneSelectionnee?.className).toMatch(/selectionnee/);
  });
});

describe('EtatVide', () => {
  it('rend une phrase utile, jamais un tiret', () => {
    render(<EtatVide titre="Aucune session sur cette période." />);
    expect(screen.getByRole('status')).toHaveTextContent('Aucune session sur cette période.');
  });

  it('rend le détail et l’action quand ils sont fournis', () => {
    render(
      <EtatVide
        titre="Aucun budget défini."
        detail="Créez un budget pour surveiller vos dépenses."
        action={<button type="button">Nouveau budget</button>}
      />,
    );
    expect(screen.getByText('Créez un budget pour surveiller vos dépenses.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Nouveau budget' })).toBeInTheDocument();
  });
});

describe('BandeauErreur', () => {
  it('affiche le message du backend', () => {
    render(<BandeauErreur message="Le paramètre fin est antérieur à début." />);
    expect(screen.getByRole('alert')).toHaveTextContent('Le paramètre fin est antérieur à début.');
  });

  it('ne rend pas de bouton de reprise sans onReessayer', () => {
    render(<BandeauErreur message="Service indisponible." />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('appelle onReessayer au clic sur le bouton de reprise', async () => {
    const utilisateur = userEvent.setup();
    const onReessayer = vi.fn();
    render(<BandeauErreur message="Service indisponible." onReessayer={onReessayer} />);
    await utilisateur.click(screen.getByRole('button', { name: 'Réessayer' }));
    expect(onReessayer).toHaveBeenCalledOnce();
  });

  it('accepte un libellé de reprise personnalisé', () => {
    render(<BandeauErreur message="Service indisponible." onReessayer={() => {}} libelleReessayer="Relancer" />);
    expect(screen.getByRole('button', { name: 'Relancer' })).toBeInTheDocument();
  });
});

describe('Icone', () => {
  it('est décorative et masquée aux lecteurs d’écran par défaut', () => {
    const { container } = render(<Icone nom="coche" />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg).toHaveAttribute('width', '16');
    expect(svg).toHaveAttribute('height', '16');
  });

  it('devient accessible avec un rôle et un libellé quand un titre est fourni', () => {
    render(<Icone nom="cercle-erreur" titre="Erreur" />);
    expect(screen.getByRole('img', { name: 'Erreur' })).toBeInTheDocument();
  });

  it('accepte une taille personnalisée', () => {
    const { container } = render(<Icone nom="fleche-haut" taille={20} />);
    expect(container.querySelector('svg')).toHaveAttribute('width', '20');
  });

  it('rend chaque icône du registre sans erreur', () => {
    const noms = [
      'tableau-de-bord',
      'sessions',
      'budgets',
      'modeles-agents',
      'reglages',
      'logo',
      'fleche-haut',
      'fleche-bas',
      'alerte',
      'coche',
      'plus',
      'moins',
      'export',
      'cercle-erreur',
      'menu',
    ] as const;
    for (const nom of noms) {
      const { container, unmount } = render(<Icone nom={nom} />);
      expect(container.querySelector('svg')?.children.length).toBeGreaterThan(0);
      unmount();
    }
  });
});
