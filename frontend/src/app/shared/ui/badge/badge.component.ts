import {
  ChangeDetectionStrategy,
  Component,
  input,
} from '@angular/core';

@Component({
  selector: 'ds-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  template: `
    <span
      class="ds-badge"
      [class.ds-badge--success]="variant() === 'success'"
      [class.ds-badge--warning]="variant() === 'warning'"
      [class.ds-badge--danger]="variant() === 'danger'"
      [class.ds-badge--info]="variant() === 'info'"
      [attr.data-test]="dataTest()">
      <ng-content />
    </span>
  `,
  styleUrl: './badge.component.css',
})
export class BadgeComponent {
  readonly variant = input<'success' | 'warning' | 'danger' | 'info' | 'default'>('default');
  readonly dataTest = input<string>('');
}
