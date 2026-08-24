import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { httpResource } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Product, CreateProduct, UpdateProduct } from '../models/product.model';

@Injectable({ providedIn: 'root' })
export class ProductApi {
  private readonly http = inject(HttpClient);
  private readonly base = '/api/products';

  /**
   * Reactive refresh counter — incrementing this signal causes `all` to re-fetch.
   */
  private readonly _refreshTick = signal(0);

  /** Reactive list of all products (httpResource, re-fetches on refresh). */
  readonly all = httpResource<Product[]>(() => {
    // reading _refreshTick creates a reactive dependency
    this._refreshTick();
    return this.base;
  });

  /** Force a re-fetch of `all`. */
  refresh(): void {
    this._refreshTick.update(n => n + 1);
  }

  getById(id: string): Observable<Product> {
    return this.http.get<Product>(`${this.base}/${id}`);
  }

  create(body: CreateProduct): Observable<Product> {
    return this.http.post<Product>(this.base, body).pipe(
      tap(() => this.refresh()),
    );
  }

  update(id: string, body: UpdateProduct): Observable<Product> {
    return this.http.put<Product>(`${this.base}/${id}`, body).pipe(
      tap(() => this.refresh()),
    );
  }
}
