import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { TranslocoModule } from '@jsverse/transloco';
import { ProductApi } from '../../../core/api/product-api';
import { Product, ProblemDetail } from '../../../core/models/product.model';
import { BadgeComponent } from '../../../shared/ui/badge/badge.component';
import { CardComponent } from '../../../shared/ui/card/card.component';

@Component({
  selector: 'app-product-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [RouterLink, DecimalPipe, TranslocoModule, BadgeComponent, CardComponent],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.css',
})
export class ProductDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(ProductApi);
  private readonly pageHeading = viewChild<ElementRef<HTMLElement>>('pageHeading');

  protected readonly product = signal<Product | null>(null);
  protected readonly loading = signal(true);
  protected readonly notFound = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly quantityVariant = computed((): 'success' | 'warning' | 'danger' => {
    const p = this.product();
    if (!p) return 'success';
    if (p.quantity === 0) return 'danger';
    if (p.quantity < 5) return 'warning';
    return 'success';
  });

  constructor() {
    // Move focus to the product name heading when it becomes available (SPA a11y, WCAG 2.4.3)
    effect(() => {
      if (this.product()) {
        this.pageHeading()?.nativeElement.focus();
      }
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.notFound.set(true);
      this.loading.set(false);
      return;
    }
    this.api.getById(id).subscribe({
      next: (p) => {
        this.product.set(p);
        this.loading.set(false);
      },
      error: (err: ProblemDetail) => {
        if (err.status === 404) {
          this.notFound.set(true);
        } else {
          this.errorMessage.set(err.detail ?? null);
        }
        this.loading.set(false);
      },
    });
  }
}
