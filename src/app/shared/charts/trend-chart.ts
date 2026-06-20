import {
  ChangeDetectionStrategy,
  Component,
  afterNextRender,
  computed,
  input,
  signal,
} from '@angular/core';

export interface TrendPoint {
  label: string;
  income: number;
  expense: number;
}

const W = 360;
const H = 200;
const PAD = { top: 16, right: 14, bottom: 30, left: 14 };

@Component({
  selector: 'sf-trend-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg [attr.viewBox]="'0 0 ' + W + ' ' + H" class="chart" role="img" [attr.aria-label]="ariaLabel()">
      <!-- gridlines -->
      @for (g of gridlines(); track g.y) {
        <line class="grid" [attr.x1]="pad.left" [attr.x2]="W - pad.right" [attr.y1]="g.y" [attr.y2]="g.y" />
      }

      @if (incomePath()) {
        <path class="area area-income" [attr.d]="incomeArea()" />
        <path
          class="line line-income"
          [attr.d]="incomePath()"
          pathLength="1"
          [style.stroke-dashoffset]="drawn() ? 0 : 1"
        />
      }
      @if (expensePath()) {
        <path class="area area-expense" [attr.d]="expenseArea()" />
        <path
          class="line line-expense"
          [attr.d]="expensePath()"
          pathLength="1"
          [style.stroke-dashoffset]="drawn() ? 0 : 1"
        />
      }

      @for (t of ticks(); track t.x) {
        <text class="tick" [attr.x]="t.x" [attr.y]="H - 8" text-anchor="middle">{{ t.label }}</text>
      }
    </svg>

    <div class="key">
      <span class="k k-income"><i></i>Income</span>
      <span class="k k-expense"><i></i>Expense</span>
    </div>
  `,
  styles: `
    :host {
      display: block;
    }
    .chart {
      width: 100%;
      height: auto;
      overflow: visible;
    }
    .grid {
      stroke: var(--color-line);
      stroke-width: 1;
      opacity: 0.6;
    }
    .line {
      fill: none;
      stroke-width: 2.5;
      stroke-linejoin: round;
      stroke-linecap: round;
      stroke-dasharray: 1;
      transition: stroke-dashoffset 1.1s var(--ease-sf, ease);
    }
    .line-income {
      stroke: var(--color-income);
    }
    .line-expense {
      stroke: var(--color-expense);
    }
    .area {
      stroke: none;
      opacity: 0.12;
    }
    .area-income {
      fill: var(--color-income);
    }
    .area-expense {
      fill: var(--color-expense);
    }
    .tick {
      fill: var(--color-ink-faint);
      font-family: var(--font-mono);
      font-size: 9px;
    }
    .key {
      display: flex;
      gap: 18px;
      margin-top: 8px;
      font-size: 12px;
      color: var(--color-ink-soft);
    }
    .k {
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .k i {
      width: 14px;
      height: 3px;
      border-radius: 2px;
    }
    .k-income i {
      background: var(--color-income);
    }
    .k-expense i {
      background: var(--color-expense);
    }
  `,
})
export class TrendChart {
  readonly data = input<TrendPoint[]>([]);

  protected readonly W = W;
  protected readonly H = H;
  protected readonly pad = PAD;
  protected readonly drawn = signal(false);

  private readonly max = computed(() => {
    const vals = this.data().flatMap((p) => [p.income, p.expense]);
    return Math.max(1, ...vals);
  });

  private x(i: number): number {
    const n = this.data().length;
    if (n <= 1) return PAD.left;
    const span = W - PAD.left - PAD.right;
    return PAD.left + (span * i) / (n - 1);
  }
  private y(v: number): number {
    const span = H - PAD.top - PAD.bottom;
    return PAD.top + span * (1 - v / this.max());
  }

  private path(key: 'income' | 'expense'): string {
    const pts = this.data();
    if (!pts.length) return '';
    return pts.map((p, i) => `${i ? 'L' : 'M'} ${this.x(i).toFixed(1)} ${this.y(p[key]).toFixed(1)}`).join(' ');
  }
  private area(key: 'income' | 'expense'): string {
    const pts = this.data();
    if (!pts.length) return '';
    const base = H - PAD.bottom;
    const top = this.path(key);
    return `${top} L ${this.x(pts.length - 1).toFixed(1)} ${base} L ${this.x(0).toFixed(1)} ${base} Z`;
  }

  protected incomePath = computed(() => this.path('income'));
  protected expensePath = computed(() => this.path('expense'));
  protected incomeArea = computed(() => this.area('income'));
  protected expenseArea = computed(() => this.area('expense'));

  protected ticks = computed(() =>
    this.data().map((p, i) => ({ x: this.x(i), label: p.label })),
  );
  protected gridlines = computed(() => {
    const lines = [];
    for (let i = 0; i <= 3; i++) {
      lines.push({ y: PAD.top + ((H - PAD.top - PAD.bottom) * i) / 3 });
    }
    return lines;
  });
  protected ariaLabel = computed(() =>
    this.data()
      .map((p) => `${p.label}: income ${Math.round(p.income)}, expense ${Math.round(p.expense)}`)
      .join('; '),
  );

  constructor() {
    afterNextRender(() => requestAnimationFrame(() => this.drawn.set(true)));
  }
}
