import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  OnInit,
  signal,
  computed,
  viewChild,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { ProductApi } from '../../../core/api/product-api';
import { Product, CreateProduct, UpdateProduct, ProblemDetail } from '../../../core/models/product.model';
import { CardComponent } from '../../../shared/ui/card/card.component';
import { InputComponent } from '../../../shared/ui/input/input.component';

interface ProductFormValue {
  reference: string;
  name: string;
  description: string;
  category: string;
  unitPrice: number | null;
  quantity: number | null;
}

@Component({
  selector: 'app-product-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, TranslocoModule, CardComponent, InputComponent],
  templateUrl: './product-form.component.html',
  styleUrl: './product-form.component.css',
})
export class ProductFormComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(ProductApi);
  private readonly transloco = inject(TranslocoService);
  private readonly pageHeading = viewChild<ElementRef<HTMLElement>>('pageHeading');

  protected readonly editId = signal<string | null>(null);
  protected readonly isEditMode = computed(() => this.editId() !== null);

  constructor() {
    // Move focus to the form title after navigation (SPA a11y, WCAG 2.4.3)
    afterNextRender(() => {
      this.pageHeading()?.nativeElement.focus();
    });
  }
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly notFound = signal(false);
  protected readonly serverError = signal<string | null>(null);
  protected readonly fieldErrors = signal<Record<string, string>>({});

  readonly form = new FormGroup({
    reference: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(64)],
    }),
    name: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(120)],
    }),
    description: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.maxLength(2000)],
    }),
    category: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(60)],
    }),
    unitPrice: new FormControl<number | null>(null, {
      validators: [Validators.required, Validators.min(0)],
    }),
    quantity: new FormControl<number | null>(null, {
      validators: [Validators.required, Validators.min(0)],
    }),
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.editId.set(id);
      this.loading.set(true);
      this.form.get('reference')?.disable();
      this.api.getById(id).subscribe({
        next: (product: Product) => {
          this.prefillForm(product);
          this.loading.set(false);
        },
        error: (err: ProblemDetail) => {
          if (err.status === 404) {
            this.notFound.set(true);
          } else {
            this.serverError.set(err.detail ?? this.transloco.translate('products.form.validation.serverError'));
          }
          this.loading.set(false);
        },
      });
    }
  }

  private prefillForm(product: Product): void {
    this.form.patchValue({
      reference: product.reference,
      name: product.name,
      description: product.description ?? '',
      category: product.category,
      unitPrice: product.unitPrice,
      quantity: product.quantity,
    });
  }

  protected getFieldError(fieldName: string): string {
    // Server-side field error takes precedence
    const serverErr = this.fieldErrors()[fieldName];
    if (serverErr) return serverErr;

    const control = this.form.get(fieldName);
    if (!control || !control.invalid || !control.touched) return '';

    if (control.errors?.['required']) {
      return this.transloco.translate('products.form.validation.required');
    }
    if (control.errors?.['min']) {
      return this.transloco.translate('products.form.validation.minValue');
    }
    if (control.errors?.['maxlength']) {
      return this.transloco.translate('products.form.validation.maxLength');
    }
    return '';
  }

  protected onSubmit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    this.saving.set(true);
    this.serverError.set(null);
    this.fieldErrors.set({});

    const raw = this.form.getRawValue() as ProductFormValue;

    if (this.isEditMode()) {
      const body: UpdateProduct = {
        name: raw.name,
        description: raw.description || undefined,
        category: raw.category,
        unitPrice: raw.unitPrice ?? 0,
        quantity: raw.quantity ?? 0,
      };
      this.api.update(this.editId()!, body).subscribe({
        next: (product: Product) => {
          this.saving.set(false);
          void this.router.navigate(['/products', product.id]);
        },
        error: (err: ProblemDetail) => {
          this.handleServerError(err);
        },
      });
    } else {
      const body: CreateProduct = {
        reference: raw.reference,
        name: raw.name,
        description: raw.description || undefined,
        category: raw.category,
        unitPrice: raw.unitPrice ?? 0,
        quantity: raw.quantity ?? 0,
      };
      this.api.create(body).subscribe({
        next: (product: Product) => {
          this.saving.set(false);
          void this.router.navigate(['/products', product.id]);
        },
        error: (err: ProblemDetail) => {
          this.handleServerError(err);
        },
      });
    }
  }

  private handleServerError(err: ProblemDetail): void {
    this.saving.set(false);
    if (err.errors) {
      this.fieldErrors.set(err.errors);
    }
    if (err.status === 409) {
      this.fieldErrors.update(e => ({
        ...e,
        reference: this.transloco.translate('products.form.validation.referenceUnique'),
      }));
    } else {
      this.serverError.set(
        err.detail ?? this.transloco.translate('products.form.validation.serverError'),
      );
    }
  }
}
