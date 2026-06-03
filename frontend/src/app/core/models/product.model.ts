export interface Product {
  id: string;
  reference: string;
  name: string;
  description?: string;
  category: string;
  unitPrice: number;
  quantity: number;
}

export type CreateProduct = Omit<Product, 'id'>;
export type UpdateProduct = Omit<Product, 'id' | 'reference'>;

export interface ProblemDetail {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  errors?: Record<string, string>;
}
