export interface AnalyticsPeriodRequest {
  startDate?: string;
  endDate?: string;
}

export interface PeriodSummaryResponse {
  startDate?: string;
  endDate?: string;
  totalIncome?: number;
  totalExpense?: number;
  net?: number;
  transactionCount?: number;
  topCategoryId?: string;
  /** The "Highest Spending Driver" for the period. */
  topCategoryName?: string;
  topCategoryAmount?: number;
}

export interface CategorySpendingResponse {
  categoryId?: string;
  categoryName?: string;
  totalSpent?: number;
  percentage?: number;
}

export interface SpendingByCategoryResponse {
  totalExpense?: number;
  categories?: CategorySpendingResponse[];
}

export interface MonthlyTrendPointResponse {
  year?: number;
  month?: number;
  totalIncome?: number;
  totalExpense?: number;
  net?: number;
}
