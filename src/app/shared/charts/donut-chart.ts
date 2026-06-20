import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  signal,
} from '@angular/core';
import { afterNextRender } from '@angular/core';

export interface DonutDatum {
  label: string;
  value: number;
}

/** Categorical palette tuned to read on warm light grounds across themes. */
const PALETTE = [
  '#2c8c7e', '#c0892a', '#b23a2e', '#3a6ea5',
  '#8a6a3d', '#9e3f5c', '#5f7d4f', '#7a5ea8',
];

const C = 2 * Math.PI * 52; // circumference for r=52

@Component({
  selector: 'sf-donut-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="wrap">
      <svg viewBox="0 0 140 140" class="donut" role="img" [attr.aria-label]="ariaLabel()">
        <circle class="track" cx="70" cy="70" r="52" />
        @for (seg of segments(); track seg.label) {
          <circle
            class="seg"
            cx="70"
            cy="70"
            r="52"
            [attr.stroke]="seg.color"
            [attr.stroke-dasharray]="drawn() ? seg.dash : '0 ' + C"
            [attr.stroke-dashoffset]="seg.offset"
          />
        }
      </svg>
      <div class="center">
        <span class="eyebrow">{{ centerLabel() }}</span>
        <span class="total num">{{ centerValue() }}</span>
      </div>
    </div>

    <ul class="legend">
      @for (seg of segments(); track seg.label) {
        <li>
          <span class="dot" [style.background-color]="seg.color"></span>
          <span class="name">{{ seg.label }}</span>
          <span class="pct num">{{ seg.pct }}%</span>
        </li>
      }
    </ul>
  `,
  styles: `
    :host {
      display: flex;
      gap: 22px;
      align-items: center;
      flex-wrap: wrap;
    }
    .wrap {
      position: relative;
      width: 160px;
      height: 160px;
      flex: none;
    }
    .donut {
      width: 100%;
      height: 100%;
      transform: rotate(-90deg);
    }
    .track {
      fill: none;
      stroke: var(--color-surface-2);
      stroke-width: 14;
    }
    .seg {
      fill: none;
      stroke-width: 14;
      stroke-linecap: butt;
      transition: stroke-dasharray 0.9s var(--ease-sf, ease);
    }
    .center {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 2px;
    }
    .total {
      font-size: 18px;
      font-weight: 700;
      color: var(--color-ink);
    }
    .legend {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 8px;
      flex: 1;
      min-width: 160px;
    }
    .legend li {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      color: var(--color-ink-soft);
    }
    .dot {
      width: 10px;
      height: 10px;
      border-radius: 3px;
      flex: none;
    }
    .name {
      flex: 1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .pct {
      font-weight: 600;
      color: var(--color-ink);
    }
  `,
})
export class DonutChart {
  readonly data = input<DonutDatum[]>([]);
  readonly centerLabel = input('Total');
  readonly centerValue = input('');

  protected readonly C = C;
  protected readonly drawn = signal(false);

  protected readonly total = computed(() =>
    this.data().reduce((sum, d) => sum + (d.value || 0), 0),
  );

  protected readonly segments = computed(() => {
    const total = this.total();
    let cumulative = 0;
    return this.data().map((d, i) => {
      const fraction = total > 0 ? d.value / total : 0;
      const len = fraction * C;
      const seg = {
        label: d.label,
        color: PALETTE[i % PALETTE.length],
        dash: `${len} ${C - len}`,
        offset: -cumulative,
        pct: Math.round(fraction * 100),
      };
      cumulative += len;
      return seg;
    });
  });

  protected readonly ariaLabel = computed(() =>
    this.segments()
      .map((s) => `${s.label} ${s.pct}%`)
      .join(', '),
  );

  constructor() {
    afterNextRender(() => {
      // next frame so the transition has an initial 0-length to grow from
      requestAnimationFrame(() => this.drawn.set(true));
    });
  }
}
