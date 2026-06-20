import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';

import { NotificationService } from '../../core/api/notification.service';
import { NotificationType } from '../../core/models';
import { Icon } from '../ui/icon';

const TYPE_LABEL: Record<NotificationType, string> = {
  OVERDRAFT_ALERT: 'Overdraft',
  BUDGET_WARNING: 'Budget',
  SYSTEM_UPDATE: 'System',
  RECURRING_INFO: 'Recurring',
  TRANSACTION_SUCCESS: 'Activity',
};

@Component({
  selector: 'sf-notification-bell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  template: `
    <button
      type="button"
      class="bell"
      [attr.aria-expanded]="open()"
      aria-haspopup="true"
      [attr.aria-label]="
        count() ? count() + ' unread notifications' : 'Notifications, none unread'
      "
      (click)="toggle()"
    >
      <sf-icon name="bell" [size]="20" />
      @if (count()) {
        <span class="badge num">{{ count() > 9 ? '9+' : count() }}</span>
      }
    </button>

    @if (open()) {
      <div class="backdrop" (click)="close()"></div>
      <div class="panel" role="dialog" aria-label="Notifications">
        <header class="panel-head">
          <span class="eyebrow">Notifications</span>
        </header>
        @if (items().length) {
          <ul class="list">
            @for (n of items(); track n.id) {
              <li class="item">
                <span class="kind kind-{{ n.notificationType }}">
                  {{ label(n.notificationType) }}
                </span>
                <div class="body">
                  <p class="title">{{ n.title }}</p>
                  <p class="msg">{{ n.message }}</p>
                </div>
                <button
                  type="button"
                  class="dismiss"
                  [attr.aria-label]="'Dismiss ' + n.title"
                  (click)="dismiss(n.id)"
                >
                  <sf-icon name="close" [size]="15" />
                </button>
              </li>
            }
          </ul>
        } @else {
          <p class="empty">You're all caught up.</p>
        }
      </div>
    }
  `,
  styles: `
    :host {
      position: relative;
      display: inline-flex;
    }
    .bell {
      position: relative;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border: 1px solid var(--color-line);
      border-radius: var(--radius-sf);
      background: var(--color-surface);
      color: var(--color-ink-soft);
      cursor: pointer;
      transition: background-color 0.2s var(--ease-sf, ease);
    }
    .bell:hover {
      background: var(--color-surface-2);
    }
    .badge {
      position: absolute;
      top: -5px;
      right: -5px;
      min-width: 18px;
      height: 18px;
      padding: 0 4px;
      display: grid;
      place-items: center;
      font-size: 10px;
      font-weight: 600;
      color: var(--color-on-accent);
      background: var(--color-expense);
      border-radius: 999px;
    }
    .backdrop {
      position: fixed;
      inset: 0;
      z-index: 40;
    }
    .panel {
      position: absolute;
      top: calc(100% + 10px);
      right: 0;
      z-index: 50;
      width: min(340px, 86vw);
      max-height: 70vh;
      overflow: auto;
      padding: 12px;
      background: var(--color-surface);
      border: 1px solid var(--color-line);
      border-radius: var(--radius-sf-lg);
      box-shadow: 0 18px 40px -20px color-mix(in srgb, var(--color-ink) 45%, transparent);
      animation: pop 0.22s var(--ease-sf, ease);
    }
    @keyframes pop {
      from {
        opacity: 0;
        transform: translateY(-6px);
      }
    }
    .panel-head {
      margin-bottom: 8px;
    }
    .list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .item {
      display: grid;
      grid-template-columns: auto 1fr auto;
      gap: 8px;
      align-items: start;
      padding: 8px;
      border-radius: var(--radius-sf);
      background: var(--color-surface-2);
    }
    .kind {
      font-family: var(--font-mono);
      font-size: 9px;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      padding: 3px 6px;
      border-radius: 999px;
      color: var(--color-ink);
      background: var(--color-paper-deep);
      white-space: nowrap;
    }
    .kind-OVERDRAFT_ALERT,
    .kind-BUDGET_WARNING {
      color: var(--color-on-accent);
      background: var(--color-expense);
    }
    .title {
      margin: 0;
      font-size: 13px;
      font-weight: 600;
      color: var(--color-ink);
    }
    .msg {
      margin: 2px 0 0;
      font-size: 12px;
      color: var(--color-ink-soft);
    }
    .dismiss {
      border: none;
      background: transparent;
      color: var(--color-ink-faint);
      cursor: pointer;
      padding: 2px;
      border-radius: 6px;
    }
    .dismiss:hover {
      color: var(--color-ink);
    }
    .empty {
      margin: 12px 4px;
      font-size: 13px;
      color: var(--color-ink-soft);
    }
  `,
})
export class NotificationBell {
  private readonly notifications = inject(NotificationService);

  protected readonly items = this.notifications.items;
  protected readonly count = this.notifications.unreadCount;
  protected readonly open = signal(false);

  protected toggle(): void {
    this.open.update((v) => !v);
  }
  protected close(): void {
    this.open.set(false);
  }
  protected dismiss(id?: string): void {
    this.notifications.dismiss(id);
  }
  protected label(type?: NotificationType): string {
    return type ? TYPE_LABEL[type] : 'Note';
  }
}
