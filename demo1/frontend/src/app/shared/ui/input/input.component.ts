import {
  ChangeDetectionStrategy,
  Component,
  input,
  computed,
} from '@angular/core';

@Component({
  selector: 'ds-input',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  template: `
    <div class="ds-input-wrapper">
      <label
        class="ds-input-label"
        [for]="inputId()">
        {{ label() }}
        @if (required()) {
          <span aria-hidden="true" class="ds-input-required">*</span>
        }
      </label>
      <ng-content />
      @if (error()) {
        <p
          class="ds-input-error"
          role="alert"
          [id]="errorId()">
          {{ error() }}
        </p>
      }
    </div>
  `,
  styleUrl: './input.component.css',
})
export class InputComponent {
  readonly inputId = input.required<string>();
  readonly label = input.required<string>();
  readonly required = input(false);
  readonly error = input<string>('');

  protected readonly errorId = computed(() => `${this.inputId()}-error`);
}
