import {
  animate,
  animateChild,
  query,
  stagger,
  style,
  transition,
  trigger,
} from '@angular/animations';

/**
 * Shared animation triggers. All are no-ops under prefers-reduced-motion
 * because the global stylesheet collapses transition/animation durations.
 */

/** Fade + rise used on cards and panels entering the viewport. */
export const fadeRise = trigger('fadeRise', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(10px)' }),
    animate('420ms cubic-bezier(0.22, 1, 0.36, 1)', style({ opacity: 1, transform: 'none' })),
  ]),
]);

/** Stagger children in. Mark items with @listItem; container uses @listStagger. */
export const listStagger = trigger('listStagger', [
  transition('* => *', [
    query(
      ':enter',
      [
        style({ opacity: 0, transform: 'translateY(12px)' }),
        stagger(55, [
          animate(
            '420ms cubic-bezier(0.22, 1, 0.36, 1)',
            style({ opacity: 1, transform: 'none' }),
          ),
        ]),
      ],
      { optional: true },
    ),
    query('@*', animateChild(), { optional: true }),
  ]),
]);

/** A single list item's own enter, drivable independently. */
export const listItem = trigger('listItem', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(12px)' }),
    animate('380ms cubic-bezier(0.22, 1, 0.36, 1)', style({ opacity: 1, transform: 'none' })),
  ]),
]);
