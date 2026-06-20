import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type IconName =
  | 'dashboard'
  | 'ledger'
  | 'tag'
  | 'target'
  | 'repeat'
  | 'chart'
  | 'bell'
  | 'logout'
  | 'plus'
  | 'close'
  | 'check'
  | 'chevron-down'
  | 'chevron-left'
  | 'chevron-right'
  | 'arrow-up'
  | 'arrow-down'
  | 'edit'
  | 'trash'
  | 'filter'
  | 'menu'
  | 'search'
  | 'inbox';

/** Stroked line icons on a 24px grid, currentColor, decorative by default. */
const PATHS: Record<IconName, string> = {
  dashboard: 'M4 13h7V4H4v9Zm0 7h7v-5H4v5Zm9 0h7v-9h-7v9Zm0-16v5h7V4h-7Z',
  ledger: 'M5 4h11l3 3v13H5V4Zm3 6h8M8 14h8M8 18h5',
  tag: 'M4 4h7l9 9-7 7-9-9V4Zm3.5 3.5h.01',
  target: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 4a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm0 4a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z',
  repeat: 'M4 9a7 7 0 0 1 12-3l2 2M20 15a7 7 0 0 1-12 3l-2-2M17 4v4h-4M7 20v-4h4',
  chart: 'M4 20V4M4 20h16M8 16v-5M12 16V8M16 16v-3',
  bell: 'M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6ZM10 20a2 2 0 0 0 4 0',
  logout: 'M14 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M9 12h10M15 8l4 4-4 4',
  plus: 'M12 5v14M5 12h14',
  close: 'M6 6l12 12M18 6 6 18',
  check: 'M5 13l4 4L19 7',
  'chevron-down': 'M6 9l6 6 6-6',
  'chevron-left': 'M15 6l-6 6 6 6',
  'chevron-right': 'M9 6l6 6-6 6',
  'arrow-up': 'M12 19V5M6 11l6-6 6 6',
  'arrow-down': 'M12 5v14M6 13l6 6 6-6',
  edit: 'M4 20h4L19 9l-4-4L4 16v4ZM14 6l4 4',
  trash: 'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13',
  filter: 'M4 5h16l-6 8v6l-4-2v-4L4 5Z',
  menu: 'M4 7h16M4 12h16M4 17h16',
  search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14Zm6 13 4 4',
  inbox: 'M4 13l2-8h12l2 8M4 13v6h16v-6M4 13h5l1 2h4l1-2h5',
};

@Component({
  selector: 'sf-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg
      [attr.width]="size()"
      [attr.height]="size()"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.7"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path [attr.d]="d()" />
    </svg>
  `,
  styles: `
    :host {
      display: inline-flex;
      line-height: 0;
    }
  `,
})
export class Icon {
  readonly name = input.required<IconName>();
  readonly size = input(20);

  protected d(): string {
    return PATHS[this.name()];
  }
}
