import { TransactionType } from './enums';

export interface TransactionCreateRequest {
  categoryId?: string;
  amount: number;
  transactionType?: TransactionType;
  note?: string;
  idempotencyKey?: string;
}

export type TransactionUpdateRequest = Partial<
  Pick<TransactionCreateRequest, 'categoryId' | 'amount' | 'note'>
>;

export interface TransactionResponse {
  id?: string;
  categoryId?: string;
  categoryName?: string;
  amount?: number;
  transactionType?: TransactionType;
  note?: string;
  createdAt?: string;
  updatedAt?: string;
  active?: boolean;
  isOverBudget?: boolean;
  warningMessage?: string;
}

export interface TransactionFilterRequest {
  startDate?: string;
  endDate?: string;
  categoryId?: string;
  transactionType?: TransactionType;
}

export interface BalanceResponse {
  totalIncome?: number;
  totalExpense?: number;
  currentBalance?: number;
}
