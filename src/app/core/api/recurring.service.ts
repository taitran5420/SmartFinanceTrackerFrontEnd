import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  RecurringTransactionCreateRequest,
  RecurringTransactionResponse,
  RecurringTransactionUpdateRequest,
  UpcomingRecurringResponse,
} from '../models';

@Injectable({ providedIn: 'root' })
export class RecurringService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/recurring-transactions`;

  list(): Observable<RecurringTransactionResponse[]> {
    return this.http.get<RecurringTransactionResponse[]>(this.base);
  }

  /** GET /recurring-transactions/upcoming — items due in the next 7 days. */
  upcoming(): Observable<UpcomingRecurringResponse[]> {
    return this.http.get<UpcomingRecurringResponse[]>(`${this.base}/upcoming`);
  }

  get(id: string): Observable<RecurringTransactionResponse> {
    return this.http.get<RecurringTransactionResponse>(`${this.base}/${id}`);
  }

  create(body: RecurringTransactionCreateRequest): Observable<RecurringTransactionResponse> {
    return this.http.post<RecurringTransactionResponse>(this.base, body);
  }

  update(
    id: string,
    body: RecurringTransactionUpdateRequest,
  ): Observable<RecurringTransactionResponse> {
    return this.http.put<RecurringTransactionResponse>(`${this.base}/${id}`, body);
  }

  /** PATCH /recurring-transactions/{id}/toggle — pause / resume the schedule. */
  toggle(id: string): Observable<RecurringTransactionResponse> {
    return this.http.patch<RecurringTransactionResponse>(`${this.base}/${id}/toggle`, {});
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
