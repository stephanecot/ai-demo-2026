import { TestBed } from '@angular/core/testing';
import { provideRouter, ActivatedRoute, Router } from '@angular/router';
import { importProvidersFrom, provideZonelessChangeDetection } from '@angular/core';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { ProductFormComponent } from './product-form.component';
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
      form: {
        createTitle: 'Create a product',
        editTitle: 'Edit product',
        save: 'Save',
        saving: 'Saving…',
        cancel: 'Cancel',
        loading: 'Loading form…',
        notFound: 'Product not found for editing.',
        fields: {
          reference: 'Reference (SKU)',
          name: 'Name',
          description: 'Description (optional)',
          category: 'Category',
          unitPrice: 'Unit price (€)',
          quantity: 'Quantity in stock',
        },
        placeholders: {
          reference: 'E.g. SKU-001',
          name: 'E.g. Arabica Coffee 1kg',
          description: 'Product description…',
          category: 'E.g. beverages',
          unitPrice: '0.00',
          quantity: '0',
        },
        validation: {
          required: 'This field is required.',
          minValue: 'Value must be greater than or equal to 0.',
          maxLength: 'Value exceeds the maximum allowed length.',
          referenceUnique: 'This reference is already used by another product.',
          serverError: 'An error occurred while saving. Please try again.',
        },
        success: {
          created: 'Product created successfully.',
          updated: 'Product updated successfully.',
        },
      },
      detail: {
        back: 'Back to list',
      },
    },
  },
};

function createMockApi(options: {
  getByIdResult?: Product | ProblemDetail;
  createResult?: Product | ProblemDetail;
} = {}) {
  const mockApi = {
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    refresh: vi.fn(),
    all: {
      value: vi.fn().mockReturnValue([]),
      isLoading: vi.fn().mockReturnValue(false),
      error: vi.fn().mockReturnValue(undefined),
    },
  };

  if (options.getByIdResult) {
    const r = options.getByIdResult;
    const isError = 'status' in r && !('reference' in r);
    mockApi.getById.mockReturnValue(
      isError ? throwError(() => r) : of(r as Product),
    );
  }

  if (options.createResult) {
    const r = options.createResult;
    const isError = 'status' in r && !('reference' in r);
    mockApi.create.mockReturnValue(
      isError ? throwError(() => r) : of(r as Product),
    );
  }

  return mockApi;
}

describe('ProductFormComponent — create mode', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([{ path: 'products/:id', component: ProductFormComponent }]),
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
            snapshot: { paramMap: { get: () => null } },
          },
        },
      ],
    });
  });

  it('renders the create form title', async () => {
    const mockApi = createMockApi();
    TestBed.overrideProvider(ProductApi, { useValue: mockApi });

    const fixture = TestBed.createComponent(ProductFormComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const title = fixture.nativeElement.querySelector('.form-title');
    expect(title?.textContent?.trim()).toContain('Create a product');
  });

  it('shows validation error when required fields are empty and form is submitted', async () => {
    const mockApi = createMockApi();
    TestBed.overrideProvider(ProductApi, { useValue: mockApi });

    const fixture = TestBed.createComponent(ProductFormComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const submitBtn = fixture.nativeElement.querySelector('[data-test="submit-btn"]') as HTMLButtonElement;
    submitBtn.click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    // Required validation errors should appear for required fields
    const errorElements = fixture.nativeElement.querySelectorAll('.ds-input-error');
    expect(errorElements.length).toBeGreaterThan(0);
  });

  it('calls api.create with valid form data and navigates on success', async () => {
    const mockApi = createMockApi({ createResult: mockProduct });
    TestBed.overrideProvider(ProductApi, { useValue: mockApi });

    const fixture = TestBed.createComponent(ProductFormComponent);
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const comp = fixture.componentInstance;
    comp.form.setValue({
      reference: 'SKU-001',
      name: 'Café Arabica 1kg',
      description: '',
      category: 'beverages',
      unitPrice: 12.9,
      quantity: 42,
    });
    fixture.detectChanges();

    const submitBtn = fixture.nativeElement.querySelector('[data-test="submit-btn"]') as HTMLButtonElement;
    submitBtn.click();
    await fixture.whenStable();

    expect(mockApi.create).toHaveBeenCalledWith({
      reference: 'SKU-001',
      name: 'Café Arabica 1kg',
      description: undefined,
      category: 'beverages',
      unitPrice: 12.9,
      quantity: 42,
    });
    expect(navigateSpy).toHaveBeenCalledWith(['/products', '1']);
  });

  it('shows server error on 409 duplicate reference', async () => {
    const conflictError: ProblemDetail = {
      type: 'about:blank',
      title: 'Conflict',
      status: 409,
      detail: 'Reference already exists',
    };
    const mockApi = createMockApi({ createResult: conflictError });
    TestBed.overrideProvider(ProductApi, { useValue: mockApi });

    const fixture = TestBed.createComponent(ProductFormComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const comp = fixture.componentInstance;
    comp.form.setValue({
      reference: 'SKU-001',
      name: 'Café Arabica 1kg',
      description: '',
      category: 'beverages',
      unitPrice: 12.9,
      quantity: 42,
    });

    comp.form.markAllAsTouched();
    const submitBtn = fixture.nativeElement.querySelector('[data-test="submit-btn"]') as HTMLButtonElement;
    submitBtn.click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const errorElements = fixture.nativeElement.querySelectorAll('.ds-input-error');
    expect(errorElements.length).toBeGreaterThan(0);
  });
});

describe('ProductFormComponent — edit mode', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([{ path: 'products/:id/edit', component: ProductFormComponent }]),
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

  it('renders the edit form title', async () => {
    const mockApi = createMockApi({ getByIdResult: mockProduct });
    TestBed.overrideProvider(ProductApi, { useValue: mockApi });

    const fixture = TestBed.createComponent(ProductFormComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const title = fixture.nativeElement.querySelector('.form-title');
    expect(title?.textContent?.trim()).toContain('Edit product');
  });

  it('prefills the form with the existing product data', async () => {
    const mockApi = createMockApi({ getByIdResult: mockProduct });
    TestBed.overrideProvider(ProductApi, { useValue: mockApi });

    const fixture = TestBed.createComponent(ProductFormComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const nameInput = fixture.nativeElement.querySelector('[data-test="input-name"]') as HTMLInputElement;
    expect(nameInput?.value).toBe('Café Arabica 1kg');

    const categoryInput = fixture.nativeElement.querySelector('[data-test="input-category"]') as HTMLInputElement;
    expect(categoryInput?.value).toBe('beverages');
  });

  it('calls api.update on save and navigates to detail', async () => {
    const updatedProduct: Product = { ...mockProduct, name: 'Updated Coffee', quantity: 50 };

    const mockApi = {
      getById: vi.fn().mockReturnValue(of(mockProduct)),
      update: vi.fn().mockReturnValue(of(updatedProduct)),
      create: vi.fn(),
      refresh: vi.fn(),
      all: {
        value: vi.fn().mockReturnValue([]),
        isLoading: vi.fn().mockReturnValue(false),
        error: vi.fn().mockReturnValue(undefined),
      },
    };
    TestBed.overrideProvider(ProductApi, { useValue: mockApi });

    const fixture = TestBed.createComponent(ProductFormComponent);
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const nameInput = fixture.nativeElement.querySelector('[data-test="input-name"]') as HTMLInputElement;
    nameInput.value = 'Updated Coffee';
    nameInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const submitBtn = fixture.nativeElement.querySelector('[data-test="submit-btn"]') as HTMLButtonElement;
    submitBtn.click();
    await fixture.whenStable();

    expect(mockApi.update).toHaveBeenCalledWith('1', expect.objectContaining({
      category: 'beverages',
      unitPrice: 12.9,
      quantity: 42,
    }));
    expect(navigateSpy).toHaveBeenCalledWith(['/products', '1']);
  });
});
