import { HttpClient } from '@angular/common/http';
import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval, startWith, switchMap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { NotificationResponse } from '../models';
import { AuthTokenService } from '../auth/auth-token.service';

/**
 * Live unread-notification feed. Tries the server-sent-events stream
 * (/notifications/subscribe) and falls back to polling /notifications/unread.
 * Exposes the current unread list + count as signals for the bell.
 */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly http = inject(HttpClient);
  private readonly tokens = inject(AuthTokenService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly base = `${environment.apiBaseUrl}/notifications`;

  private readonly _items = signal<NotificationResponse[]>([]);
  private stream?: EventSource;
  private started = false;

  readonly items = this._items.asReadonly();
  readonly unreadCount = computed(() => this._items().length);

  /** Begin receiving notifications. Safe to call once after login. */
  start(): void {
    if (this.started) {
      return;
    }
    this.started = true;
    this.poll();
    this.openStream();
  }

  stop(): void {
    this.started = false;
    this.stream?.close();
    this.stream = undefined;
    this._items.set([]);
  }

  /** Locally dismiss one (no backend "mark read" endpoint is exposed). */
  dismiss(id?: string): void {
    if (!id) {
      return;
    }
    this._items.update((list) => list.filter((n) => n.id !== id));
  }

  private poll(): void {
    interval(30_000)
      .pipe(
        startWith(0),
        switchMap(() => this.http.get<NotificationResponse[]>(`${this.base}/unread`)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (list) => this._items.set(list ?? []),
        error: () => {
          /* transient; next tick retries */
        },
      });
  }

  private openStream(): void {
    if (typeof EventSource === 'undefined') {
      return;
    }
    const token = this.tokens.token();
    // EventSource can't set headers; pass the token as a query param so a
    // token-aware backend can authenticate the stream. Harmless otherwise.
    const url = token
      ? `${this.base}/subscribe?token=${encodeURIComponent(token)}`
      : `${this.base}/subscribe`;
    try {
      this.stream = new EventSource(url);
      this.stream.onmessage = (event) => {
        try {
          const n = JSON.parse(event.data) as NotificationResponse;
          this._items.update((list) => [n, ...list.filter((x) => x.id !== n.id)]);
        } catch {
          /* non-JSON keep-alive ping */
        }
      };
      this.stream.onerror = () => {
        // Let polling carry the load; the browser auto-reconnects the stream.
      };
    } catch {
      /* stream unsupported — polling already covers us */
    }
  }
}
