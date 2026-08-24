import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { TranslocoModule } from '@jsverse/transloco';
import { ProductApi } from '../../../core/api/product-api';
import { ButtonComponent } from '../../../shared/ui/button/button.component';
import { BadgeComponent } from '../../../shared/ui/badge/badge.component';
import { CardComponent } from '../../../shared/ui/card/card.component';
import { Product } from '../../../core/models/product.model';

@Component({
  selector: 'app-product-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [RouterLink, DecimalPipe, TranslocoModule, ButtonComponent, BadgeComponent, CardComponent],
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.css',
})
export class ProductListComponent {
  protected readonly api = inject(ProductApi);

  private readonly pageHeading = viewChild<ElementRef<HTMLElement>>('pageHeading');

  constructor() {
    // Move focus to the page heading after navigation (SPA a11y, WCAG 2.4.3)
    afterNextRender(() => {
      this.pageHeading()?.nativeElement.focus();
    });
  }

  protected quantityVariant(product: Product): 'success' | 'warning' | 'danger' {
    if (product.quantity === 0) return 'danger';
    if (product.quantity < 5) return 'warning';
    return 'success';
  }
}
