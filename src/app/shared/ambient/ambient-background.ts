import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';

import { ThemeService } from '../../core/theme/theme.service';

interface Particle {
  readonly left: number; // vw
  readonly delay: number; // s
  readonly duration: number; // s
  readonly scale: number;
  readonly drift: number; // px horizontal sway
}

/** Deterministic pseudo-random so positions are stable across renders. */
function particles(count: number): Particle[] {
  const out: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const r = (n: number) => ((Math.sin(i * 12.9898 + n * 78.233) * 43758.5453) % 1 + 1) % 1;
    out.push({
      left: Math.round(r(1) * 100),
      delay: +(r(2) * 12).toFixed(2),
      duration: +(9 + r(3) * 9).toFixed(2),
      scale: +(0.6 + r(4) * 0.8).toFixed(2),
      drift: Math.round((r(5) - 0.5) * 120),
    });
  }
  return out;
}

/**
 * Fixed, non-interactive atmosphere behind the app. Each theme gets its
 * own motif: Dawn Bay drifts a warm haze, Sakura lets petals fall,
 * Imperial Jade floats gold motes upward. All decorative (aria-hidden)
 * and stilled by prefers-reduced-motion via the global stylesheet.
 */
@Component({
  selector: 'sf-ambient-background',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true', class: 'ambient' },
  template: `
    @switch (theme()) {
      @case ('dawn') {
        <div class="haze haze-a"></div>
        <div class="haze haze-b"></div>
      }
      @case ('sakura') {
        @for (p of petals; track $index) {
          <span
            class="petal"
            [style.left.vw]="p.left"
            [style.animation-delay.s]="p.delay"
            [style.animation-duration.s]="p.duration"
            [style.--drift.px]="p.drift"
            [style.--scale]="p.scale"
          ></span>
        }
      }
      @case ('imperial') {
        @for (p of motes; track $index) {
          <span
            class="mote"
            [style.left.vw]="p.left"
            [style.animation-delay.s]="p.delay"
            [style.animation-duration.s]="p.duration"
            [style.--drift.px]="p.drift"
            [style.--scale]="p.scale"
          ></span>
        }
      }
    }
  `,
  styles: `
    :host {
      position: fixed;
      inset: 0;
      z-index: 0;
      overflow: hidden;
      pointer-events: none;
    }

    /* Dawn Bay — slow warm haze drifting across the horizon. */
    .haze {
      position: absolute;
      border-radius: 50%;
      filter: blur(40px);
      opacity: 0.5;
    }
    .haze-a {
      top: -12%;
      right: -6%;
      width: 60vw;
      height: 46vh;
      background: radial-gradient(circle, var(--color-glow-1), transparent 70%);
      animation: drift-a 26s var(--ease-sf, ease) infinite alternate;
    }
    .haze-b {
      bottom: -16%;
      left: -10%;
      width: 54vw;
      height: 42vh;
      background: radial-gradient(circle, var(--color-glow-2), transparent 70%);
      animation: drift-b 32s var(--ease-sf, ease) infinite alternate;
    }
    @keyframes drift-a {
      to {
        transform: translate(-7%, 6%) scale(1.12);
      }
    }
    @keyframes drift-b {
      to {
        transform: translate(8%, -5%) scale(1.16);
      }
    }

    /* Sakura — petals falling and swaying. */
    .petal {
      position: absolute;
      top: -5vh;
      width: 12px;
      height: 12px;
      background: var(--color-glow-1);
      border-radius: 76% 24% 70% 30% / 30% 70% 30% 70%;
      opacity: 0;
      transform: scale(var(--scale, 1));
      animation-name: fall;
      animation-timing-function: linear;
      animation-iteration-count: infinite;
    }
    @keyframes fall {
      0% {
        opacity: 0;
        transform: translate(0, -5vh) rotate(0deg) scale(var(--scale, 1));
      }
      10% {
        opacity: 0.85;
      }
      90% {
        opacity: 0.85;
      }
      100% {
        opacity: 0;
        transform: translate(var(--drift, 0), 105vh) rotate(420deg) scale(var(--scale, 1));
      }
    }

    /* Imperial Jade — gold motes rising like embers. */
    .mote {
      position: absolute;
      bottom: -4vh;
      width: 6px;
      height: 6px;
      border-radius: 999px;
      background: var(--color-glow-1);
      box-shadow: 0 0 8px 1px var(--color-glow-1);
      opacity: 0;
      transform: scale(var(--scale, 1));
      animation-name: rise;
      animation-timing-function: ease-in;
      animation-iteration-count: infinite;
    }
    @keyframes rise {
      0% {
        opacity: 0;
        transform: translate(0, 0) scale(var(--scale, 1));
      }
      15% {
        opacity: 0.9;
      }
      85% {
        opacity: 0.7;
      }
      100% {
        opacity: 0;
        transform: translate(var(--drift, 0), -108vh) scale(var(--scale, 1));
      }
    }
  `,
})
export class AmbientBackground {
  private readonly themeService = inject(ThemeService);
  protected readonly theme = this.themeService.current;

  protected readonly petals = particles(16);
  protected readonly motes = particles(22);
}
