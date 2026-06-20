import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  MonthlyTrendPointResponse,
  PeriodSummaryResponse,
  SpendingByCategoryResponse,
} from '../models';

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/analytics`;

  /** GET /analytics/summary — totals + the highest spending driver for a period. */
  summary(startDate: string, endDate: string): Observable<PeriodSummaryResponse> {
    const params = new HttpParams().set('startDate', startDate).set('endDate', endDate);
    return this.http.get<PeriodSummaryResponse>(`${this.base}/summary`, { params });
  }

  /** GET /analytics/spending-by-category — expense breakdown for a period. */
  spendingByCategory(
    startDate: string,
    endDate: string,
  ): Observable<SpendingByCategoryResponse> {
    const params = new HttpParams().set('startDate', startDate).set('endDate', endDate);
    return this.http.get<SpendingByCategoryResponse>(`${this.base}/spending-by-category`, {
      params,
    });
  }

  /** GET /analytics/income-expense-trend — monthly trend points. */
  incomeExpenseTrend(
    startDate: string,
    endDate: string,
  ): Observable<MonthlyTrendPointResponse[]> {
    const params = new HttpParams().set('startDate', startDate).set('endDate', endDate);
    return this.http.get<MonthlyTrendPointResponse[]>(`${this.base}/income-expense-trend`, {
      params,
    });
  }
}
