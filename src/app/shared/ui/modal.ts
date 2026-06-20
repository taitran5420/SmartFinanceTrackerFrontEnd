import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';

import { Icon } from './icon';

/**
 * Accessible modal dialog. Render conditionally with @if from the parent.
 * Closes on backdrop click, the × button, or Escape, and focuses itself
 * on open. Project a footer with `[modalFooter]`.
 */
@Component({
  selector: 'sf-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  template: `
    <div class="backdrop" (click)="close.emit()"></div>
    <div
      #panel
      class="panel"
      role="dialog"
      aria-modal="true"
      [attr.aria-label]="title()"
      tabindex="-1"
      (keydown.escape)="close.emit()"
    >
      <header class="head">
        <h2 class="title">{{ title() }}</h2>
        <button type="button" class="x" aria-label="Close dialog" (click)="close.emit()">
          <sf-icon name="close" [size]="18" />
        </button>
      </header>
      <div class="body">
        <ng-content />
      </div>
      <footer class="foot">
        <ng-content select="[modalFooter]" />
      </footer>
    </div>
  `,
  styles: `
    :host {
      position: fixed;
      inset: 0;
      z-index: 100;
      display: grid;
      place-items: center;
      padding: 20px;
    }
    .backdrop {
      position: absolute;
      inset: 0;
      background: color-mix(in srgb, var(--color-ink) 42%, transparent);
      backdrop-filter: blur(2px);
      animation: fade 0.2s var(--ease-sf, ease);
    }
    .panel {
      position: relative;
      width: min(520px, 100%);
      max-height: 88vh;
      overflow: auto;
      background: var(--color-surface);
      border: 1px solid var(--color-line);
      border-radius: var(--radius-sf-lg);
      box-shadow: 0 40px 80px -30px color-mix(in srgb, var(--color-ink) 60%, transparent);
      animation: rise 0.26s var(--ease-sf, ease);
    }
    .head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 18px 20px;
      border-bottom: 1px solid var(--color-line);
      position: sticky;
      top: 0;
      background: var(--color-surface);
    }
    .title {
      margin: 0;
      font-family: var(--font-display);
      font-size: 19px;
      font-weight: 700;
      color: var(--color-ink);
    }
    .x {
      display: inline-flex;
      border: none;
      background: transparent;
      color: var(--color-ink-faint);
      cursor: pointer;
      padding: 4px;
      border-radius: 6px;
    }
    .x:hover {
      color: var(--color-ink);
      background: var(--color-surface-2);
    }
    .body {
      padding: 20px;
    }
    .foot {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      padding: 16px 20px;
      border-top: 1px solid var(--color-line);
      position: sticky;
      bottom: 0;
      background: var(--color-surface);
    }
    @keyframes fade {
      from {
        opacity: 0;
      }
    }
    @keyframes rise {
      from {
        opacity: 0;
        transform: translateY(14px) scale(0.98);
      }
    }
  `,
})
export class Modal implements AfterViewInit {
  readonly title = input('');
  readonly close = output<void>();

  private readonly panel = viewChild.required<ElementRef<HTMLElement>>('panel');

  ngAfterViewInit(): void {
    queueMicrotask(() => this.panel().nativeElement.focus());
  }
}
