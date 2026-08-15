export interface BudgetCreateRequest {
  categoryId: string;
  amountLimit: number;
  month: number;
  year: number;
}

export type BudgetUpdateRequest = Partial<Pick<BudgetCreateRequest, 'amountLimit'>>;

export interface BudgetResponse {
  id?: string;
  categoryId?: string;
  amountLimit?: number;
  month?: number;
  year?: number;
  createdAt?: string;
  updatedAt?: string;
  active?: boolean;
}

export interface BudgetSummaryResponse {
  budgetId?: string;
  categoryId?: string;
  categoryName?: string;
  amountLimit?: number;
  spentAmount?: number;
  remaining?: number;
  /** 0–100+ ; can exceed 100 when over budget. */
  progressPercentage?: number;
  isOverBudget?: boolean;
}
