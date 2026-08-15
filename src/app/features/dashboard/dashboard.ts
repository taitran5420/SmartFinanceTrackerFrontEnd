import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';

import { AnalyticsService } from '../../core/api/analytics.service';
import { RecurringService } from '../../core/api/recurring.service';
import { TransactionService } from '../../core/api/transaction.service';
import {
  BalanceResponse,
  PeriodSummaryResponse,
  SpendingByCategoryResponse,
  UpcomingRecurringResponse,
} from '../../core/models';
import { DonutChart, DonutDatum } from '../../shared/charts/donut-chart';
import { TrendChart, TrendPoint } from '../../shared/charts/trend-chart';
import { MoneyPipe } from '../../shared/format/money.pipe';
import { currentMonth, formatDate, lastMonths, monthLabel } from '../../shared/format/dates';
import { fadeRise } from '../../shared/motion/animations';
import { CountUp } from '../../shared/motion/count-up';
import { Icon } from '../../shared/ui/icon';

@Component({
  selector: 'sf-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, DonutChart, TrendChart, MoneyPipe, CountUp, Icon],
  animations: [fadeRise],
  template: `
    <header class="sf-page-head">
      <div>
        <span class="eyebrow">{{ today }}</span>
        <h1 class="sf-title">{{ greeting }}</h1>
      </div>
      <a routerLink="/transactions" class="sf-btn sf-btn-primary">
        <sf-icon name="plus" [size]="18" /> Add transaction
      </a>
    </header>

    @if (loading()) {
      <div class="grid">
        <div class="sf-skeleton" style="grid-column: span 2; height: 180px"></div>
        <div class="sf-skeleton" style="height: 180px"></div>
        <div class="sf-skeleton" style="height: 260px"></div>
        <div class="sf-skeleton" style="grid-column: span 2; height: 260px"></div>
      </div>
    } @else {
      <div class="grid">
        <!-- Hero: the balance, the one figure that matters most -->
        <section class="sf-card hero" @fadeRise style="grid-column: span 2">
          <span class="eyebrow">Current balance</span>
          <p class="balance num" [class.sf-neg]="(balance()?.currentBalance ?? 0) < 0">
            <span
              sfCountUp
              [value]="balance()?.currentBalance ?? 0"
              [fractionDigits]="2"
              prefix="$"
            ></span>
          </p>
          <div class="flows">
            <div class="flow">
              <span class="flow-label"><sf-icon name="arrow-down" [size]="15" /> Income</span>
              <span class="num sf-pos">{{ balance()?.totalIncome | money }}</span>
            </div>
            <div class="flow">
              <span class="flow-label"><sf-icon name="arrow-up" [size]="15" /> Expense</span>
              <span class="num sf-neg">{{ balance()?.totalExpense | money }}</span>
            </div>
          </div>
        </section>

        <!-- This month KPIs -->
        <section class="sf-card kpis" @fadeRise>
          <span class="eyebrow">This month</span>
          <div class="kpi">
            <span class="kpi-label">Net</span>
            <span
              class="num kpi-value"
              [class.sf-pos]="(summary()?.net ?? 0) >= 0"
              [class.sf-neg]="(summary()?.net ?? 0) < 0"
              >{{ summary()?.net | money: { signed: true } }}</span
            >
          </div>
          <div class="kpi">
            <span class="kpi-label">Transactions</span>
            <span class="num kpi-value">{{ summary()?.transactionCount ?? 0 }}</span>
          </div>
          <div class="kpi">
            <span class="kpi-label">Top driver</span>
            <span class="kpi-value driver">{{ summary()?.topCategoryName || '—' }}</span>
          </div>
        </section>

        <!-- Spending by category -->
        <section class="sf-card" @fadeRise>
          <h2 class="sf-card-title">Where it went</h2>
          @if (spendingData().length) {
            <sf-donut-chart
              [data]="spendingData()"
              centerLabel="Spent"
              [centerValue]="spendingTotal()"
            />
          } @else {
            <p class="muted">No expenses recorded this month yet.</p>
          }
        </section>

        <!-- Trend -->
        <section class="sf-card" @fadeRise style="grid-column: span 2">
          <h2 class="sf-card-title">Income vs expense · last 6 months</h2>
          @if (trend().length) {
            <sf-trend-chart [data]="trend()" />
          } @else {
            <p class="muted">Not enough history yet.</p>
          }
        </section>

        <!-- Upcoming recurring -->
        <section class="sf-card" @fadeRise>
          <h2 class="sf-card-title">Upcoming</h2>
          @if (upcoming().length) {
            <ul class="upcoming">
              @for (u of upcoming(); track u.id) {
                <li>
                  <div>
                    <p class="up-name">{{ u.categoryName || 'Scheduled' }}</p>
                    <p class="up-when">
                      {{ formatDate(u.nextOccurrenceDate) }} · in {{ u.daysUntilDue ?? 0 }}d
                    </p>
                  </div>
                  <span class="num up-amt">{{ u.amount | money }}</span>
                </li>
              }
            </ul>
          } @else {
            <p class="muted">Nothing scheduled in the next week.</p>
          }
        </section>
      </div>
    }
  `,
  styles: `
    .grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 18px;
    }
    @media (max-width: 900px) {
      .grid {
        grid-template-columns: 1fr;
      }
      .grid section {
        grid-column: auto !important;
      }
    }
    .hero {
      display: flex;
      flex-direction: column;
      gap: 4px;
      justify-content: center;
      background: linear-gradient(
        135deg,
        color-mix(in srgb, var(--color-accent) 12%, var(--color-surface)),
        var(--color-surface)
      );
    }
    .balance {
      margin: 4px 0 14px;
      font-size: clamp(34px, 5vw, 52px);
      font-weight: 700;
      letter-spacing: -0.02em;
      color: var(--color-ink);
    }
    .flows {
      display: flex;
      gap: 28px;
    }
    .flow {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .flow-label {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      font-size: 12px;
      color: var(--color-ink-soft);
    }
    .flow .num {
      font-size: 18px;
      font-weight: 600;
    }
    .kpis {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .kpi {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 10px;
      padding-top: 8px;
      border-top: 1px solid color-mix(in srgb, var(--color-line) 60%, transparent);
    }
    .kpi:first-of-type {
      border-top: none;
    }
    .kpi-label {
      font-size: 13px;
      color: var(--color-ink-soft);
    }
    .kpi-value {
      font-size: 18px;
      font-weight: 700;
      color: var(--color-ink);
    }
    .driver {
      font-size: 14px;
      font-family: var(--font-display);
      max-width: 14ch;
      text-align: right;
    }
    .upcoming {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .upcoming li {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
    }
    .up-name {
      margin: 0;
      font-weight: 600;
      font-size: 14px;
      color: var(--color-ink);
    }
    .up-when {
      margin: 2px 0 0;
      font-size: 12px;
      color: var(--color-ink-faint);
    }
    .up-amt {
      font-weight: 600;
    }
    .muted {
      color: var(--color-ink-soft);
      font-size: 14px;
    }
  `,
})
export class Dashboard {
  private readonly transactions = inject(TransactionService);
  private readonly analytics = inject(AnalyticsService);
  private readonly recurring = inject(RecurringService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly loading = signal(true);
  protected readonly balance = signal<BalanceResponse | null>(null);
  protected readonly summary = signal<PeriodSummaryResponse | null>(null);
  protected readonly spending = signal<SpendingByCategoryResponse | null>(null);
  protected readonly trend = signal<TrendPoint[]>([]);
  protected readonly upcoming = signal<UpcomingRecurringResponse[]>([]);

  protected readonly formatDate = formatDate;
  protected readonly today = formatDate(new Date().toISOString());
  protected readonly greeting = this.buildGreeting();

  protected spendingData(): DonutDatum[] {
    return (this.spending()?.categories ?? []).map((c) => ({
      label: c.categoryName ?? 'Uncategorized',
      value: c.totalSpent ?? 0,
    }));
  }
  protected spendingTotal(): string {
    const t = this.spending()?.totalExpense ?? 0;
    return t.toLocaleString(undefined, {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    });
  }

  constructor() {
    const month = currentMonth();
    const half = lastMonths(6);

    forkJoin({
      balance: this.transactions.balance(),
      summary: this.analytics.summary(month.startDate, month.endDate),
      spending: this.analytics.spendingByCategory(month.startDate, month.endDate),
      trend: this.analytics.incomeExpenseTrend(half.startDate, half.endDate),
      upcoming: this.recurring.upcoming(),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.balance.set(res.balance);
          this.summary.set(res.summary);
          this.spending.set(res.spending);
          this.trend.set(
            (res.trend ?? []).map((p) => ({
              label: monthLabel(p.month ?? 1),
              income: p.totalIncome ?? 0,
              expense: p.totalExpense ?? 0,
            })),
          );
          this.upcoming.set(res.upcoming ?? []);
          this.loading.set(false);
        },
        error: (err) => {
          console.error('[dashboard] load failed', err);
          this.loading.set(false);
        },
      });
  }

  private buildGreeting(): string {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  }
}
