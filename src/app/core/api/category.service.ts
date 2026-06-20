import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  CategoryCreateRequest,
  CategoryResponse,
  CategoryUpdateRequest,
  TransactionType,
} from '../models';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/categories`;

  /** GET /categories — optionally gated by transaction type (Feature 2). */
  list(transactionType?: TransactionType): Observable<CategoryResponse[]> {
    let params = new HttpParams();
    if (transactionType) {
      params = params.set('transactionType', transactionType);
    }
    return this.http.get<CategoryResponse[]>(this.base, { params });
  }

  create(body: CategoryCreateRequest): Observable<CategoryResponse> {
    return this.http.post<CategoryResponse>(this.base, body);
  }

  update(categoryId: string, body: CategoryUpdateRequest): Observable<CategoryResponse> {
    return this.http.put<CategoryResponse>(`${this.base}/${categoryId}`, body);
  }

  delete(categoryId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${categoryId}`);
  }
}
