/** Shared enum-like unions used across the domain (mirrors the backend). */

export type TransactionType = 'INCOME' | 'EXPENSE';

export type RecurrenceFrequency = 'ONCE' | 'DAILY' | 'WEEKLY' | 'MONTHLY';

export type NotificationType =
  | 'OVERDRAFT_ALERT'
  | 'BUDGET_WARNING'
  | 'SYSTEM_UPDATE'
  | 'RECURRING_INFO'
  | 'TRANSACTION_SUCCESS';

/** The hard overdraft floor enforced by the backend (US: Overdraft Protection). */
export const OVERDRAFT_FLOOR = -1000;

/** Default category sets, gated by transaction type (Feature 2). */
export const EXPENSE_CATEGORIES = [
  'Food & Dining',
  'Rent & Housing',
  'Transport',
  'Healthcare',
  'Entertainment',
  'Utilities',
  'Shopping',
  'Education',
  'Other Expense',
] as const;

export const INCOME_CATEGORIES = [
  'Salary',
  'Freelance',
  'Business Revenue',
  'Investment Return',
  'Gift',
  'Bonus',
  'Rental Income',
  'Other Income',
] as const;
