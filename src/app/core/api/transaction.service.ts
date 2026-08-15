import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  BalanceResponse,
  PageQuery,
  Slice,
  TransactionCreateRequest,
  TransactionFilterRequest,
  TransactionResponse,
  TransactionUpdateRequest,
} from '../models';

@Injectable({ providedIn: 'root' })
export class TransactionService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/transactions`;

  /** GET /transactions — filtered, paged slice of the ledger. */
  list(
    filter: TransactionFilterRequest = {},
    page: PageQuery = {},
  ): Observable<Slice<TransactionResponse>> {
    let params = new HttpParams();
    for (const [key, value] of Object.entries({ ...filter, ...page })) {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    }
    return this.http.get<Slice<TransactionResponse>>(this.base, { params });
  }

  /** GET /transactions/balance — derived income / expense / current balance. */
  balance(): Observable<BalanceResponse> {
    return this.http.get<BalanceResponse>(`${this.base}/balance`);
  }

  get(id: string): Observable<TransactionResponse> {
    return this.http.get<TransactionResponse>(`${this.base}/${id}`);
  }

  create(body: TransactionCreateRequest): Observable<TransactionResponse> {
    return this.http.post<TransactionResponse>(this.base, body);
  }

  update(id: string, body: TransactionUpdateRequest): Observable<TransactionResponse> {
    return this.http.put<TransactionResponse>(`${this.base}/${id}`, body);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
