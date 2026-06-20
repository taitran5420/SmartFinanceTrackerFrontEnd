import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { ThemeService } from '../../core/theme/theme.service';

/**
 * Palette switcher. A small radio-group of three theme chips; each chip
 * previews its palette with three live swatches. Selection swaps the
 * <html data-theme> token set, which cross-fades the whole app.
 */
@Component({
  selector: 'sf-theme-picker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <fieldset class="picker" role="radiogroup" aria-label="Color theme">
      @for (theme of themes; track theme.id) {
        <button
          type="button"
          role="radio"
          class="chip"
          [class.is-active]="theme.id === current()"
          [attr.aria-checked]="theme.id === current()"
          [attr.aria-label]="theme.name + ' — ' + theme.origin + '. ' + theme.blurb"
          [title]="theme.blurb"
          (click)="select(theme.id)"
        >
          <span class="swatches" aria-hidden="true">
            @for (hex of theme.swatch; track hex) {
              <span class="sw" [style.background-color]="hex"></span>
            }
          </span>
          <span class="label">
            <span class="name">{{ theme.name }}</span>
            <span class="origin">{{ theme.origin }}</span>
          </span>
        </button>
      }
    </fieldset>
  `,
  styles: `
    :host {
      display: block;
    }
    .picker {
      display: flex;
      gap: 6px;
      margin: 0;
      padding: 4px;
      border: 1px solid var(--color-line);
      border-radius: var(--radius-sf-lg);
      background: var(--color-surface);
    }
    .chip {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 10px 6px 6px;
      border: 1px solid transparent;
      border-radius: var(--radius-sf);
      background: transparent;
      color: var(--color-ink-soft);
      cursor: pointer;
      transition:
        background-color 0.2s var(--ease-sf, ease),
        border-color 0.2s var(--ease-sf, ease),
        color 0.2s var(--ease-sf, ease);
    }
    .chip:hover {
      background: var(--color-surface-2);
    }
    .chip.is-active {
      background: var(--color-surface-2);
      border-color: var(--color-accent);
      color: var(--color-ink);
    }
    .swatches {
      display: inline-flex;
      border-radius: 999px;
      overflow: hidden;
      box-shadow: 0 0 0 1px color-mix(in srgb, var(--color-ink) 14%, transparent);
    }
    .sw {
      width: 13px;
      height: 20px;
    }
    .label {
      display: flex;
      flex-direction: column;
      line-height: 1.1;
      text-align: left;
    }
    .name {
      font-family: var(--font-display);
      font-size: 12.5px;
      font-weight: 600;
    }
    .origin {
      font-family: var(--font-mono);
      font-size: 9.5px;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: var(--color-ink-faint);
    }
    /* Collapse to swatches-only on narrow shells. */
    @media (max-width: 720px) {
      .label {
        display: none;
      }
      .chip {
        padding: 6px;
      }
    }
  `,
})
export class ThemePicker {
  private readonly themeService = inject(ThemeService);

  protected readonly themes = this.themeService.themes;
  protected readonly current = this.themeService.current;

  protected select(id: (typeof this.themes)[number]['id']): void {
    this.themeService.set(id);
  }
}
