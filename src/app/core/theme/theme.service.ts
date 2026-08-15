import { DOCUMENT } from '@angular/common';
import { Injectable, computed, effect, inject, signal } from '@angular/core';

export type ThemeId = 'dawn' | 'sakura' | 'imperial';

export interface ThemeMeta {
  readonly id: ThemeId;
  /** Display name shown in the picker. */
  readonly name: string;
  /** Where the palette comes from. */
  readonly origin: string;
  /** One line of atmosphere. */
  readonly blurb: string;
  /** Three swatch hexes for the picker chip (paper, accent, ink/secondary). */
  readonly swatch: readonly [string, string, string];
}

export const THEMES: readonly ThemeMeta[] = [
  {
    id: 'dawn',
    name: 'Dawn Bay',
    origin: 'Vietnam',
    blurb: 'Dawn over Hạ Long — rice paper, jade water, lantern gold.',
    swatch: ['#f3efe4', '#2c8c7e', '#c0892a'],
  },
  {
    id: 'sakura',
    name: 'Sakura',
    origin: 'Japan',
    blurb: 'Washi and sumi ink under a deep blossom pink.',
    swatch: ['#fbf7f2', '#c9637f', '#4f7a4a'],
  },
  {
    id: 'imperial',
    name: 'Imperial Jade',
    origin: 'China',
    blurb: 'Silk ground, lacquer ink, imperial red and gold leaf.',
    swatch: ['#f5ebd8', '#b22222', '#0e6b5c'],
  },
];

const STORAGE_KEY = 'sf.theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);

  private readonly _current = signal<ThemeId>(this.read());

  readonly current = this._current.asReadonly();
  readonly themes = THEMES;
  readonly meta = computed(
    () => THEMES.find((t) => t.id === this._current()) ?? THEMES[0],
  );

  constructor() {
    // Reflect the active theme onto <html data-theme> and persist it.
    effect(() => {
      const id = this._current();
      this.document.documentElement.dataset['theme'] = id;
      try {
        localStorage.setItem(STORAGE_KEY, id);
      } catch {
        /* storage unavailable — in-memory only */
      }
    });
  }

  set(id: ThemeId): void {
    this._current.set(id);
  }

  private read(): ThemeId {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'dawn' || saved === 'sakura' || saved === 'imperial') {
        return saved;
      }
    } catch {
      /* ignore */
    }
    return 'dawn';
  }
}
