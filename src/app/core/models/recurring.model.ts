import { RecurrenceFrequency, TransactionType } from './enums';

export interface RecurringTransactionCreateRequest {
  categoryId: string;
  amount: number;
  note?: string;
  frequency: RecurrenceFrequency;
  /** ISO date (yyyy-MM-dd). */
  startDate: string;
  endDate?: string;
  /** Time of day the occurrence runs, e.g. "09:00". */
  executionTime: string;
}

export type RecurringTransactionUpdateRequest = Partial<RecurringTransactionCreateRequest>;

export interface RecurringTransactionResponse {
  id?: string;
  categoryId?: string;
  categoryName?: string;
  amount?: number;
  transactionType?: TransactionType;
  note?: string;
  frequency?: RecurrenceFrequency;
  startDate?: string;
  endDate?: string;
  nextOccurrenceDate?: string;
  executionTime?: string;
  active?: boolean;
}

export interface UpcomingRecurringResponse {
  id?: string;
  categoryName?: string;
  amount?: number;
  frequency?: RecurrenceFrequency;
  nextOccurrenceDate?: string;
  executionTime?: string;
  daysUntilDue?: number;
}
