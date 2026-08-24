import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { importProvidersFrom, provideZonelessChangeDetection, signal } from '@angular/core';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { ProductListComponent } from './product-list.component';
import { ProductApi } from '../../../core/api/product-api';
import { Product } from '../../../core/models/product.model';

const mockProducts: Product[] = [
  {
    id: '1',
    reference: 'SKU-001',
    name: 'Café Arabica 1kg',
    category: 'beverages',
    unitPrice: 12.9,
    quantity: 42,
  },
  {
    id: '2',
    reference: 'SKU-002',
    name: 'Thé vert',
    category: 'beverages',
    unitPrice: 8.5,
    quantity: 0,
  },
];

const translations = {
  en: {
    products: {
      list: {
        title: 'Products',
        addProduct: 'Add a product',
        empty: 'No products in stock. Start by adding one.',
        loading: 'Loading products…',
        error: 'Unable to load products. Please try again.',
        columns: {
          name: 'Name',
          reference: 'Reference',
          category: 'Category',
          quantity: 'Quantity',
          price: 'Unit price',
          actions: 'Actions',
        },
        viewDetail: 'View detail',
      },
    },
  },
};

function createMockApi(overrides: Partial<{
  value: Product[] | undefined;
  isLoading: boolean;
  error: unknown;
}> = {}) {
  const value = overrides.value;
  const isLoading = overrides.isLoading ?? false;
  const error = overrides.error ?? undefined;

  return {
    all: {
      value: signal(value),
      isLoading: signal(isLoading),
      error: signal(error),
    },
    refresh: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  };
}

describe('ProductListComponent', () => {
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
      ],
    });
  });

  it('renders a row for each product', async () => {
    const mockApi = createMockApi({ value: mockProducts });
    TestBed.overrideProvider(ProductApi, { useValue: mockApi });

    const fixture = TestBed.createComponent(ProductListComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const rows = fixture.nativeElement.querySelectorAll('[data-test="product-row"]');
    expect(rows.length).toBe(2);
  });

  it('shows product name in the first row', async () => {
    const mockApi = createMockApi({ value: mockProducts });
    TestBed.overrideProvider(ProductApi, { useValue: mockApi });

    const fixture = TestBed.createComponent(ProductListComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const firstRow = fixture.nativeElement.querySelector('[data-test="product-row"]');
    expect(firstRow?.textContent).toContain('Café Arabica 1kg');
  });

  it('shows empty state when no products', async () => {
    const mockApi = createMockApi({ value: [] });
    TestBed.overrideProvider(ProductApi, { useValue: mockApi });

    const fixture = TestBed.createComponent(ProductListComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const emptyState = fixture.nativeElement.querySelector('[data-test="empty-state"]');
    expect(emptyState).toBeTruthy();
    expect(emptyState?.textContent).toContain('No products in stock');
  });

  it('shows loading state', async () => {
    const mockApi = createMockApi({ isLoading: true, value: undefined });
    TestBed.overrideProvider(ProductApi, { useValue: mockApi });

    const fixture = TestBed.createComponent(ProductListComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const loadingState = fixture.nativeElement.querySelector('[data-test="loading-state"]');
    expect(loadingState).toBeTruthy();
  });

  it('shows error state', async () => {
    const mockApi = createMockApi({ error: new Error('Network error'), value: undefined });
    TestBed.overrideProvider(ProductApi, { useValue: mockApi });

    const fixture = TestBed.createComponent(ProductListComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const errorState = fixture.nativeElement.querySelector('[data-test="error-state"]');
    expect(errorState).toBeTruthy();
  });
});
