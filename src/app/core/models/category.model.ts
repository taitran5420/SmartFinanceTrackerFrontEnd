import { TransactionType } from './enums';

export interface CategoryCreateRequest {
  categoryName: string;
  transactionType: TransactionType;
}

export type CategoryUpdateRequest = Partial<CategoryCreateRequest>;

export interface CategoryResponse {
  id?: string;
  categoryName?: string;
  transactionType?: TransactionType;
  createdAt?: string;
  updatedAt?: string;
  active?: boolean;
}
