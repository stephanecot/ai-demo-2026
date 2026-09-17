/**
 * Barrel du design system — les dix-huit composants de base. Un écran ne
 * compose jamais un élément d'interface sans passer par ce module.
 */

export { Panneau } from './Panneau';
export type { PanneauProps } from './Panneau';

export { Tuile } from './Tuile';
export type { TuileProps, ToneTuile, DeltaTuile } from './Tuile';

export { Badge } from './Badge';
export type { BadgeProps, ToneBadge } from './Badge';

export { Pastille } from './Pastille';
export type { PastilleProps } from './Pastille';

export { Tableau } from './Tableau';
export type { TableauProps, ColonneTableau } from './Tableau';

export { EtatVide } from './EtatVide';
export type { EtatVideProps } from './EtatVide';

export { BandeauErreur } from './BandeauErreur';
export type { BandeauErreurProps } from './BandeauErreur';

export { Icone } from './Icone';
export type { IconeProps, NomIcone } from './Icone';

export { Jauge } from './Jauge';
export type { JaugeProps, ToneJauge } from './Jauge';

export { SegmentControl } from './SegmentControl';
export type { SegmentControlProps, OptionSegment } from './SegmentControl';

export { Onglets } from './Onglets';
export type { OngletsProps, OptionOnglet } from './Onglets';

export { Interrupteur } from './Interrupteur';
export type { InterrupteurProps } from './Interrupteur';

export { Curseur } from './Curseur';
export type { CurseurProps } from './Curseur';

export { BoutonPrincipal } from './BoutonPrincipal';
export type { BoutonPrincipalProps } from './BoutonPrincipal';

export { BoutonFantome } from './BoutonFantome';
export type { BoutonFantomeProps } from './BoutonFantome';

export { Encart } from './Encart';
export type { EncartProps, ToneEncart } from './Encart';

export { MicroCourbe } from './MicroCourbe';
export type { MicroCourbeProps } from './MicroCourbe';

export { BarresEmpilees } from './BarresEmpilees';
export type { BarresEmpileesProps, ColonneBarres, SegmentBarre } from './BarresEmpilees';
