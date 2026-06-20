import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  BudgetCreateRequest,
  BudgetResponse,
  BudgetSummaryResponse,
  BudgetUpdateRequest,
} from '../models';

@Injectable({ providedIn: 'root' })
export class BudgetService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/budgets`;

  /** GET /budgets?categoryId=… — the backend scopes the listing by category. */
  listByCategory(categoryId: string): Observable<BudgetResponse[]> {
    const params = new HttpParams().set('categoryId', categoryId);
    return this.http.get<BudgetResponse[]>(this.base, { params });
  }

  /** GET /budgets/{id}/summary — spent / remaining / progress for a budget. */
  summary(budgetId: string): Observable<BudgetSummaryResponse> {
    return this.http.get<BudgetSummaryResponse>(`${this.base}/${budgetId}/summary`);
  }

  create(body: BudgetCreateRequest): Observable<BudgetResponse> {
    return this.http.post<BudgetResponse>(this.base, body);
  }

  update(budgetId: string, body: BudgetUpdateRequest): Observable<BudgetResponse> {
    return this.http.put<BudgetResponse>(`${this.base}/${budgetId}`, body);
  }

  delete(budgetId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${budgetId}`);
  }
}
