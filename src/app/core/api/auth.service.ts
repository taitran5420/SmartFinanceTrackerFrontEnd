import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AuthResponse, LoginRequest, RegisterRequest } from '../models';
import { AuthTokenService } from '../auth/auth-token.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly tokens = inject(AuthTokenService);
  private readonly base = `${environment.apiBaseUrl}/auth`;

  readonly isAuthenticated = this.tokens.isAuthenticated;

  login(body: LoginRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.base}/login`, body)
      .pipe(tap((res) => this.store(res)));
  }

  register(body: RegisterRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.base}/register`, body)
      .pipe(tap((res) => this.store(res)));
  }

  logout(): void {
    this.tokens.clear();
  }

  private store(res: AuthResponse): void {
    if (res.token) {
      this.tokens.set(res.token);
    }
  }
}
