import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Router } from '@angular/router';

import { AuthService } from '../core/api/auth.service';
import { NotificationService } from '../core/api/notification.service';
import { ThemeService } from '../core/theme/theme.service';
import { AmbientBackground } from '../shared/ambient/ambient-background';
import { NotificationBell } from '../shared/notification-bell/notification-bell';
import { ThemePicker } from '../shared/theme-picker/theme-picker';
import { Icon, IconName } from '../shared/ui/icon';

interface NavLink {
  readonly path: string;
  readonly label: string;
  readonly icon: IconName;
}

const NAV: readonly NavLink[] = [
  { path: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { path: '/transactions', label: 'Transactions', icon: 'ledger' },
  { path: '/categories', label: 'Categories', icon: 'tag' },
  { path: '/budgets', label: 'Budgets', icon: 'target' },
  { path: '/recurring', label: 'Recurring', icon: 'repeat' },
  { path: '/analytics', label: 'Analytics', icon: 'chart' },
];

/**
 * Authenticated application shell: ambient backdrop, a fixed sidebar of
 * feature links, and a header carrying the theme picker, notifications,
 * and sign-out. Feature pages render through the animated outlet.
 */
@Component({
  selector: 'sf-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    AmbientBackground,
    NotificationBell,
    ThemePicker,
    Icon,
  ],
  template: `
    <sf-ambient-background />

    <div class="shell" [class.nav-open]="navOpen()">
      <aside class="sidebar" [class.open]="navOpen()">
        <a routerLink="/dashboard" class="brand" (click)="closeNav()">
          <span class="mark" aria-hidden="true">財</span>
          <span class="brand-text">
            <span class="brand-name">Smart Finance</span>
            <span class="brand-sub">{{ themeMeta().origin }} · {{ themeMeta().name }}</span>
          </span>
        </a>

        <nav class="nav" aria-label="Primary">
          @for (link of nav; track link.path) {
            <a
              [routerLink]="link.path"
              routerLinkActive="active"
              class="nav-link"
              (click)="closeNav()"
            >
              <sf-icon [name]="link.icon" [size]="19" />
              <span>{{ link.label }}</span>
            </a>
          }
        </nav>

        <button type="button" class="signout" (click)="logout()">
          <sf-icon name="logout" [size]="18" />
          <span>Sign out</span>
        </button>
      </aside>

      @if (navOpen()) {
        <div class="scrim" (click)="closeNav()" aria-hidden="true"></div>
      }

      <div class="main-col">
        <header class="topbar">
          <button
            type="button"
            class="menu-btn"
            aria-label="Toggle navigation"
            [attr.aria-expanded]="navOpen()"
            (click)="toggleNav()"
          >
            <sf-icon name="menu" [size]="22" />
          </button>
          <div class="topbar-right">
            <sf-theme-picker />
            <sf-notification-bell />
          </div>
        </header>

        <main class="content" tabindex="-1">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
  styles: `
    :host {
      display: block;
      position: relative;
      z-index: 1;
    }
    .shell {
      display: grid;
      grid-template-columns: 256px 1fr;
      min-height: 100vh;
    }
    .sidebar {
      position: sticky;
      top: 0;
      height: 100vh;
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 22px 16px;
      border-right: 1px solid var(--color-line);
      background: color-mix(in srgb, var(--color-surface) 78%, transparent);
      backdrop-filter: blur(8px);
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 6px 8px 18px;
      text-decoration: none;
      color: var(--color-ink);
    }
    .mark {
      display: grid;
      place-items: center;
      width: 40px;
      height: 40px;
      border-radius: var(--radius-sf);
      background: var(--color-accent-deep);
      color: var(--color-on-accent);
      font-family: var(--font-display);
      font-size: 20px;
      font-weight: 700;
    }
    .brand-text {
      display: flex;
      flex-direction: column;
      line-height: 1.15;
    }
    .brand-name {
      font-family: var(--font-display);
      font-size: 16px;
      font-weight: 700;
    }
    .brand-sub {
      font-family: var(--font-mono);
      font-size: 9.5px;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--color-ink-faint);
    }
    .nav {
      display: flex;
      flex-direction: column;
      gap: 3px;
      flex: 1;
    }
    .nav-link {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 12px;
      border-radius: var(--radius-sf);
      text-decoration: none;
      color: var(--color-ink-soft);
      font-weight: 500;
      font-size: 14px;
      transition:
        background-color 0.18s var(--ease-sf, ease),
        color 0.18s var(--ease-sf, ease);
    }
    .nav-link:hover {
      background: var(--color-surface-2);
      color: var(--color-ink);
    }
    .nav-link.active {
      background: var(--color-accent-soft);
      color: var(--color-accent-deep);
      font-weight: 600;
    }
    .signout {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 12px;
      border: 1px solid var(--color-line);
      border-radius: var(--radius-sf);
      background: transparent;
      color: var(--color-ink-soft);
      font: inherit;
      font-size: 14px;
      cursor: pointer;
    }
    .signout:hover {
      background: var(--color-surface-2);
      color: var(--color-ink);
    }
    .main-col {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }
    .topbar {
      position: sticky;
      top: 0;
      z-index: 30;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 14px 24px;
      background: color-mix(in srgb, var(--color-paper) 72%, transparent);
      backdrop-filter: blur(8px);
      border-bottom: 1px solid var(--color-line);
    }
    .topbar-right {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-left: auto;
    }
    .menu-btn {
      display: none;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border: 1px solid var(--color-line);
      border-radius: var(--radius-sf);
      background: var(--color-surface);
      color: var(--color-ink);
      cursor: pointer;
    }
    .content {
      padding: 28px 24px 56px;
      max-width: 1200px;
      width: 100%;
      margin: 0 auto;
      outline: none;
    }
    .scrim {
      display: none;
    }

    @media (max-width: 860px) {
      .shell {
        grid-template-columns: 1fr;
      }
      .sidebar {
        position: fixed;
        z-index: 60;
        width: 256px;
        transform: translateX(-110%);
        transition: transform 0.3s var(--ease-sf, ease);
      }
      .sidebar.open {
        transform: none;
        box-shadow: 0 20px 60px -20px color-mix(in srgb, var(--color-ink) 55%, transparent);
      }
      .menu-btn {
        display: inline-flex;
      }
      .scrim {
        display: block;
        position: fixed;
        inset: 0;
        z-index: 50;
        background: color-mix(in srgb, var(--color-ink) 38%, transparent);
      }
    }
  `,
})
export class Shell {
  private readonly auth = inject(AuthService);
  private readonly notifications = inject(NotificationService);
  private readonly themeService = inject(ThemeService);
  private readonly router = inject(Router);

  protected readonly nav = NAV;
  protected readonly navOpen = signal(false);
  protected readonly themeMeta = this.themeService.meta;

  constructor() {
    this.notifications.start();
  }

  protected toggleNav(): void {
    this.navOpen.update((v) => !v);
  }
  protected closeNav(): void {
    this.navOpen.set(false);
  }

  protected logout(): void {
    this.notifications.stop();
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }
}
