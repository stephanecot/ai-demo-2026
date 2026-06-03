import {
  ChangeDetectionStrategy,
  Component,
  input,
} from '@angular/core';

@Component({
  selector: 'ds-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  template: `
    <button
      class="ds-btn"
      [class.ds-btn--primary]="variant() === 'primary'"
      [class.ds-btn--secondary]="variant() === 'secondary'"
      [class.ds-btn--danger]="variant() === 'danger'"
      [class.ds-btn--sm]="size() === 'sm'"
      [attr.type]="type()"
      [attr.disabled]="disabled() ? true : null"
      [attr.aria-busy]="loading() ? 'true' : null"
      [attr.data-test]="dataTest()">
      <ng-content />
    </button>
  `,
  styleUrl: './button.component.css',
})
export class ButtonComponent {
  readonly variant = input<'primary' | 'secondary' | 'danger'>('primary');
  readonly size = input<'sm' | 'md'>('md');
  readonly type = input<'button' | 'submit' | 'reset'>('button');
  readonly disabled = input(false);
  readonly loading = input(false);
  readonly dataTest = input<string>('');
}
