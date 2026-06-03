import {
  ChangeDetectionStrategy,
  Component,
  input,
} from '@angular/core';

@Component({
  selector: 'ds-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  template: `
    <div
      class="ds-card"
      [attr.data-test]="dataTest()">
      <ng-content />
    </div>
  `,
  styleUrl: './card.component.css',
})
export class CardComponent {
  readonly dataTest = input<string>('');
}
