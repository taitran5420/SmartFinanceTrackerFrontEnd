import { Injectable, computed, signal } from '@angular/core';

const TOKEN_KEY = 'wl.token';

/**
 * Holds the JWT returned by /auth/login and /auth/register.
 * Persisted to localStorage so a refresh keeps the session.
 */
@Injectable({ providedIn: 'root' })
export class AuthTokenService {
  private readonly _token = signal<string | null>(this.read());

  readonly token = this._token.asReadonly();
  readonly isAuthenticated = computed(() => this._token() !== null);

  set(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
    this._token.set(token);
  }

  clear(): void {
    localStorage.removeItem(TOKEN_KEY);
    this._token.set(null);
  }

  private read(): string | null {
    // localStorage is unavailable in some non-browser contexts; guard it.
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  }
}
