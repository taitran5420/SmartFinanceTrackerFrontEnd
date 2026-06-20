import {
  Directive,
  ElementRef,
  NgZone,
  effect,
  inject,
  input,
} from '@angular/core';

/**
 * Tweens an element's text from its previous value to a target number,
 * formatted as a localized figure. Respects prefers-reduced-motion
 * (snaps to the final value). Drives outside Angular's zone so each
 * frame doesn't trigger change detection.
 *
 *   <span sfCountUp [value]="balance()" [fractionDigits]="2" prefix="$"></span>
 */
@Directive({
  selector: '[sfCountUp]',
})
export class CountUp {
  readonly value = input.required<number>();
  readonly fractionDigits = input(0);
  readonly prefix = input('');
  readonly suffix = input('');
  readonly duration = input(900);

  private readonly host = inject(ElementRef<HTMLElement>).nativeElement;
  private readonly zone = inject(NgZone);
  private from = 0;
  private rafId = 0;

  constructor() {
    effect(() => {
      const target = this.value();
      if (!Number.isFinite(target)) {
        return;
      }
      const reduce =
        typeof matchMedia === 'function' &&
        matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduce) {
        this.render(target);
        this.from = target;
        return;
      }
      this.animate(this.from, target);
    });
  }

  private animate(start: number, end: number): void {
    cancelAnimationFrame(this.rafId);
    const dur = this.duration();
    this.zone.runOutsideAngular(() => {
      const t0 = performance.now();
      const step = (now: number) => {
        const p = Math.min(1, (now - t0) / dur);
        // easeOutCubic
        const eased = 1 - Math.pow(1 - p, 3);
        this.render(start + (end - start) * eased);
        if (p < 1) {
          this.rafId = requestAnimationFrame(step);
        } else {
          this.from = end;
        }
      };
      this.rafId = requestAnimationFrame(step);
    });
  }

  private render(n: number): void {
    const digits = this.fractionDigits();
    const body = n.toLocaleString(undefined, {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    });
    this.host.textContent = `${this.prefix()}${body}${this.suffix()}`;
  }
}
