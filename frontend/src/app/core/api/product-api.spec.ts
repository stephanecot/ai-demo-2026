import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import {
  provideHttpClientTesting,
  HttpTestingController,
} from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ProductApi } from './product-api';
import { Product, CreateProduct, UpdateProduct } from '../models/product.model';

const mockProduct: Product = {
  id: '665f1a2b3c4d5e6f7a8b9c0d',
  reference: 'SKU-001',
  name: 'Café Arabica 1kg',
  description: 'Un café arabica de qualité',
  category: 'beverages',
  unitPrice: 12.9,
  quantity: 42,
};

describe('ProductApi', () => {
  let api: ProductApi;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    api = TestBed.inject(ProductApi);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(api).toBeTruthy();
  });

  describe('getById', () => {
    it('fetches a product by id', () => {
      let result: Product | undefined;
      api.getById('665f1a2b3c4d5e6f7a8b9c0d').subscribe(p => (result = p));

      const req = httpMock.expectOne('/api/products/665f1a2b3c4d5e6f7a8b9c0d');
      expect(req.request.method).toBe('GET');
      req.flush(mockProduct);

      expect(result).toEqual(mockProduct);
    });
  });

  describe('create', () => {
    it('POSTs a new product and triggers a refresh', () => {
      const body: CreateProduct = {
        reference: 'SKU-001',
        name: 'Café Arabica 1kg',
        category: 'beverages',
        unitPrice: 12.9,
        quantity: 42,
      };

      let result: Product | undefined;
      api.create(body).subscribe(p => (result = p));

      const req = httpMock.expectOne('/api/products');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(body);
      req.flush(mockProduct);

      expect(result).toEqual(mockProduct);
    });
  });

  describe('update', () => {
    it('PUTs an updated product', () => {
      const body: UpdateProduct = {
        name: 'Café Arabica 1kg Updated',
        category: 'beverages',
        unitPrice: 14.0,
        quantity: 50,
      };

      let result: Product | undefined;
      api.update('665f1a2b3c4d5e6f7a8b9c0d', body).subscribe(p => (result = p));

      const req = httpMock.expectOne('/api/products/665f1a2b3c4d5e6f7a8b9c0d');
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(body);
      req.flush({ ...mockProduct, name: 'Café Arabica 1kg Updated', unitPrice: 14.0, quantity: 50 });

      expect(result?.name).toBe('Café Arabica 1kg Updated');
    });
  });
});
