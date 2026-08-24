import { TestBed } from '@angular/core/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { importProvidersFrom, provideZonelessChangeDetection } from '@angular/core';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { ProductDetailComponent } from './product-detail.component';
import { ProductApi } from '../../../core/api/product-api';
import { Product, ProblemDetail } from '../../../core/models/product.model';

const mockProduct: Product = {
  id: '1',
  reference: 'SKU-001',
  name: 'Café Arabica 1kg',
  description: 'Un café arabica de qualité',
  category: 'beverages',
  unitPrice: 12.9,
  quantity: 42,
};

const translations = {
  en: {
    products: {
      detail: {
        title: 'Product detail',
        edit: 'Edit',
        back: 'Back to list',
        notFound: 'Product not found.',
        notFoundDetail: 'This product does not exist or has been deleted.',
        loading: 'Loading product…',
        error: 'Unable to load this product.',
        noDescription: 'No description',
        fields: {
          id: 'Identifier',
          reference: 'Reference',
          name: 'Name',
          description: 'Description',
          category: 'Category',
          unitPrice: 'Unit price',
          quantity: 'Quantity in stock',
        },
      },
    },
  },
};

function createMockApi(productOrError: Product | ProblemDetail) {
  const isError = 'status' in productOrError && productOrError.status !== undefined
    && !('reference' in productOrError);
  return {
    getById: vi.fn().mockReturnValue(
      isError
        ? throwError(() => productOrError)
        : of(productOrError as Product),
    ),
    all: { value: vi.fn(), isLoading: vi.fn().mockReturnValue(false), error: vi.fn() },
    refresh: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  };
}

describe('ProductDetailComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        importProvidersFrom(
          TranslocoTestingModule.forRoot({
            langs: translations,
            translocoConfig: { defaultLang: 'en', availableLangs: ['en'] },
            preloadLangs: true,
          }),
        ),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: { get: () => '1' } },
          },
        },
      ],
    });
  });

  it('renders product name and reference', async () => {
    const mockApi = createMockApi(mockProduct);
    TestBed.overrideProvider(ProductApi, { useValue: mockApi });

    const fixture = TestBed.createComponent(ProductDetailComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const name = fixture.nativeElement.querySelector('[data-test="product-name"]');
    expect(name?.textContent?.trim()).toContain('Café Arabica 1kg');

    const reference = fixture.nativeElement.querySelector('[data-test="product-reference"]');
    expect(reference?.textContent?.trim()).toContain('SKU-001');
  });

  it('renders product category and price', async () => {
    const mockApi = createMockApi(mockProduct);
    TestBed.overrideProvider(ProductApi, { useValue: mockApi });

    const fixture = TestBed.createComponent(ProductDetailComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const category = fixture.nativeElement.querySelector('[data-test="product-category"]');
    expect(category?.textContent?.trim()).toBe('beverages');
  });

  it('shows not-found state on 404', async () => {
    const notFound: ProblemDetail = {
      type: 'about:blank',
      title: 'Not Found',
      status: 404,
      detail: 'Product not found',
    };
    const mockApi = createMockApi(notFound);
    TestBed.overrideProvider(ProductApi, { useValue: mockApi });

    const fixture = TestBed.createComponent(ProductDetailComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const notFoundState = fixture.nativeElement.querySelector('[data-test="not-found-state"]');
    expect(notFoundState).toBeTruthy();
  });
});
