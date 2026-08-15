import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { forkJoin } from 'rxjs';

import { AnalyticsService } from '../../core/api/analytics.service';
import {
  PeriodSummaryResponse,
  SpendingByCategoryResponse,
} from '../../core/models';
import { DonutChart, DonutDatum } from '../../shared/charts/donut-chart';
import { TrendChart, TrendPoint } from '../../shared/charts/trend-chart';
import { MoneyPipe } from '../../shared/format/money.pipe';
import { Period, currentMonth, lastMonths, monthLabel } from '../../shared/format/dates';
import { fadeRise } from '../../shared/motion/animations';

interface Preset {
  key: string;
  label: string;
  period: () => Period;
}

const PRESETS: Preset[] = [
  { key: 'month', label: 'This month', period: () => currentMonth() },
  { key: '3m', label: 'Last 3 months', period: () => lastMonths(3) },
  { key: '6m', label: 'Last 6 months', period: () => lastMonths(6) },
  { key: '12m', label: 'Last 12 months', period: () => lastMonths(12) },
];

@Component({
  selector: 'sf-analytics-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DonutChart, TrendChart, MoneyPipe],
  animations: [fadeRise],
  template: `
    <header class="sf-page-head">
      <div>
        <span class="eyebrow">Insights</span>
        <h1 class="sf-title">Analytics</h1>
        <p class="sf-subtitle">See the shape of your money across any stretch of time.</p>
      </div>
    </header>

    <div class="periods" role="tablist" aria-label="Reporting period">
      @for (p of presets; track p.key) {
        <button
          type="button"
          role="tab"
          class="period"
          [class.on]="active() === p.key"
          [attr.aria-selected]="active() === p.key"
          (click)="select(p)"
        >
          {{ p.label }}
        </button>
      }
    </div>

    @if (loading()) {
      <div class="grid">
        <div class="sf-skeleton" style="height: 110px"></div>
        <div class="sf-skeleton" style="height: 110px"></div>
        <div class="sf-skeleton" style="height: 110px"></div>
        <div class="sf-skeleton" style="height: 110px"></div>
        <div class="sf-skeleton" style="grid-column: span 2; height: 280px"></div>
        <div class="sf-skeleton" style="grid-column: span 2; height: 280px"></div>
      </div>
    } @else {
      <div class="grid">
        <section class="sf-card kpi" @fadeRise>
          <span class="eyebrow">Income</span>
          <span class="num kpi-val sf-pos">{{ summary()?.totalIncome | money }}</span>
        </section>
        <section class="sf-card kpi" @fadeRise>
          <span class="eyebrow">Expense</span>
          <span class="num kpi-val sf-neg">{{ summary()?.totalExpense | money }}</span>
        </section>
        <section class="sf-card kpi" @fadeRise>
          <span class="eyebrow">Net</span>
          <span
            class="num kpi-val"
            [class.sf-pos]="(summary()?.net ?? 0) >= 0"
            [class.sf-neg]="(summary()?.net ?? 0) < 0"
            >{{ summary()?.net | money: { signed: true } }}</span
          >
        </section>
        <section class="sf-card kpi" @fadeRise>
          <span class="eyebrow">Transactions</span>
          <span class="num kpi-val">{{ summary()?.transactionCount ?? 0 }}</span>
          @if (summary()?.topCategoryName) {
            <span class="kpi-sub">Top: {{ summary()?.topCategoryName }}</span>
          }
        </section>

        <section class="sf-card chart-card" @fadeRise>
          <h2 class="sf-card-title">Spending by category</h2>
          @if (spendingData().length) {
            <sf-donut-chart [data]="spendingData()" centerLabel="Spent" [centerValue]="spentTotal()" />
          } @else {
            <p class="muted">No expenses in this period.</p>
          }
        </section>

        <section class="sf-card chart-card" @fadeRise>
          <h2 class="sf-card-title">Income vs expense</h2>
          @if (trend().length) {
            <sf-trend-chart [data]="trend()" />
          } @else {
            <p class="muted">No data for this period.</p>
          }
        </section>
      </div>
    }
  `,
  styles: `
    .periods {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      margin-bottom: 20px;
    }
    .period {
      padding: 8px 14px;
      border: 1px solid var(--color-line);
      border-radius: 999px;
      background: var(--color-surface);
      color: var(--color-ink-soft);
      font: inherit;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.16s var(--ease-sf, ease);
    }
    .period:hover {
      background: var(--color-surface-2);
    }
    .period.on {
      background: var(--color-accent-deep);
      color: var(--color-on-accent);
      border-color: var(--color-accent-deep);
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 18px;
    }
    .kpi {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .kpi-val {
      font-size: 24px;
      font-weight: 700;
      color: var(--color-ink);
    }
    .kpi-sub {
      font-size: 12px;
      color: var(--color-ink-faint);
    }
    .chart-card {
      grid-column: span 2;
    }
    .muted {
      color: var(--color-ink-soft);
    }
    @media (max-width: 900px) {
      .grid {
        grid-template-columns: 1fr 1fr;
      }
      .chart-card {
        grid-column: span 2;
      }
    }
    @media (max-width: 560px) {
      .grid {
        grid-template-columns: 1fr;
      }
      .chart-card {
        grid-column: auto;
      }
    }
  `,
})
export class AnalyticsPage {
  private readonly analytics = inject(AnalyticsService);

  protected readonly presets = PRESETS;
  protected readonly active = signal('month');
  protected readonly loading = signal(true);
  protected readonly summary = signal<PeriodSummaryResponse | null>(null);
  protected readonly spending = signal<SpendingByCategoryResponse | null>(null);
  protected readonly trend = signal<TrendPoint[]>([]);

  protected readonly spendingData = computed<DonutDatum[]>(() =>
    (this.spending()?.categories ?? []).map((c) => ({
      label: c.categoryName ?? 'Uncategorized',
      value: c.totalSpent ?? 0,
    })),
  );

  constructor() {
    this.load(currentMonth());
  }

  protected select(p: Preset): void {
    if (this.active() === p.key) return;
    this.active.set(p.key);
    this.load(p.period());
  }

  protected spentTotal(): string {
    const t = this.spending()?.totalExpense ?? 0;
    return t.toLocaleString(undefined, {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    });
  }

  private load(period: Period): void {
    this.loading.set(true);
    forkJoin({
      summary: this.analytics.summary(period.startDate, period.endDate),
      spending: this.analytics.spendingByCategory(period.startDate, period.endDate),
      trend: this.analytics.incomeExpenseTrend(period.startDate, period.endDate),
    }).subscribe({
      next: (res) => {
        this.summary.set(res.summary);
        this.spending.set(res.spending);
        this.trend.set(
          (res.trend ?? []).map((p) => ({
            label: monthLabel(p.month ?? 1),
            income: p.totalIncome ?? 0,
            expense: p.totalExpense ?? 0,
          })),
        );
        this.loading.set(false);
      },
      error: (err) => {
        console.error('[analytics] load failed', err);
        this.loading.set(false);
      },
    });
  }
}
