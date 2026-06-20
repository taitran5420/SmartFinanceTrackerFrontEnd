import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { CategoryService } from '../../core/api/category.service';
import { RecurringService } from '../../core/api/recurring.service';
import {
  CategoryResponse,
  RecurrenceFrequency,
  RecurringTransactionResponse,
} from '../../core/models';
import { MoneyPipe } from '../../shared/format/money.pipe';
import { formatDate, toDateInput } from '../../shared/format/dates';
import { listStagger } from '../../shared/motion/animations';
import { Icon } from '../../shared/ui/icon';
import { Modal } from '../../shared/ui/modal';

const FREQUENCIES: RecurrenceFrequency[] = ['ONCE', 'DAILY', 'WEEKLY', 'MONTHLY'];
const FREQ_LABEL: Record<RecurrenceFrequency, string> = {
  ONCE: 'Once',
  DAILY: 'Daily',
  WEEKLY: 'Weekly',
  MONTHLY: 'Monthly',
};

@Component({
  selector: 'sf-recurring-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, MoneyPipe, Icon, Modal],
  animations: [listStagger],
  template: `
    <header class="sf-page-head">
      <div>
        <span class="eyebrow">On a schedule</span>
        <h1 class="sf-title">Recurring</h1>
        <p class="sf-subtitle">Automate the entries that repeat — rent, salary, subscriptions.</p>
      </div>
      <button type="button" class="sf-btn sf-btn-primary" (click)="openCreate()">
        <sf-icon name="plus" [size]="18" /> New schedule
      </button>
    </header>

    @if (loading()) {
      @for (i of [1, 2, 3]; track i) {
        <div class="sf-skeleton" style="height: 64px; margin-bottom: 10px"></div>
      }
    } @else if (items().length) {
      <ul class="list" [@listStagger]="items().length">
        @for (r of items(); track r.id) {
          <li class="sf-card item" [class.paused]="r.active === false">
            <div class="lead">
              <span
                class="sf-chip"
                [class.sf-chip-income]="r.transactionType === 'INCOME'"
                [class.sf-chip-expense]="r.transactionType === 'EXPENSE'"
                >{{ FREQ_LABEL[r.frequency ?? 'ONCE'] }}</span
              >
              <div>
                <p class="r-name">{{ r.categoryName || 'Scheduled entry' }}</p>
                <p class="r-meta">
                  {{ r.note || 'No note' }} · next {{ formatDate(r.nextOccurrenceDate) }}
                  @if (r.executionTime) {
                    at {{ r.executionTime }}
                  }
                </p>
              </div>
            </div>
            <div class="trail">
              <span
                class="num r-amt"
                [class.sf-pos]="r.transactionType === 'INCOME'"
                [class.sf-neg]="r.transactionType === 'EXPENSE'"
                >{{ r.amount | money }}</span
              >
              <button
                class="sf-btn sf-btn-ghost sf-btn-sm"
                (click)="toggle(r)"
                [attr.aria-pressed]="r.active !== false"
              >
                {{ r.active === false ? 'Resume' : 'Pause' }}
              </button>
              <button class="sf-icon-btn" aria-label="Edit" (click)="openEdit(r)">
                <sf-icon name="edit" [size]="16" />
              </button>
              <button class="sf-icon-btn" aria-label="Delete" (click)="askDelete(r)">
                <sf-icon name="trash" [size]="16" />
              </button>
            </div>
          </li>
        }
      </ul>
    } @else {
      <div class="sf-card sf-empty">
        <sf-icon name="repeat" [size]="30" />
        <p class="sf-empty-title">No recurring schedules</p>
        <p>Create one to stop entering the same transaction every month.</p>
      </div>
    }

    @if (formOpen()) {
      <sf-modal [title]="editTarget() ? 'Edit schedule' : 'New schedule'" (close)="formOpen.set(false)">
        <form [formGroup]="form" (ngSubmit)="submit()" novalidate id="rec-form">
          <label class="sf-field">
            <span class="sf-label">Category</span>
            <select class="sf-select" formControlName="categoryId" [class.invalid]="invalid('categoryId')">
              <option value="">Choose a category</option>
              @for (c of activeCategories(); track c.id) {
                <option [value]="c.id">{{ c.categoryName }} ({{ c.transactionType === 'INCOME' ? 'Income' : 'Expense' }})</option>
              }
            </select>
            @if (invalid('categoryId')) {
              <span class="sf-err">Choose a category.</span>
            }
          </label>

          <div class="two">
            <label class="sf-field">
              <span class="sf-label">Amount</span>
              <input
                class="sf-input"
                type="number"
                step="0.01"
                min="0"
                formControlName="amount"
                [class.invalid]="invalid('amount')"
              />
              @if (invalid('amount')) {
                <span class="sf-err">Enter an amount.</span>
              }
            </label>
            <label class="sf-field">
              <span class="sf-label">Frequency</span>
              <select class="sf-select" formControlName="frequency">
                @for (f of frequencies; track f) {
                  <option [value]="f">{{ FREQ_LABEL[f] }}</option>
                }
              </select>
            </label>
          </div>

          <div class="two">
            <label class="sf-field">
              <span class="sf-label">Start date</span>
              <input class="sf-input" type="date" formControlName="startDate" [class.invalid]="invalid('startDate')" />
              @if (invalid('startDate')) {
                <span class="sf-err">Pick a start date.</span>
              }
            </label>
            <label class="sf-field">
              <span class="sf-label">Run time</span>
              <input class="sf-input" type="time" formControlName="executionTime" [class.invalid]="invalid('executionTime')" />
              @if (invalid('executionTime')) {
                <span class="sf-err">Pick a time.</span>
              }
            </label>
          </div>

          <label class="sf-field">
            <span class="sf-label">End date <span class="opt">(optional)</span></span>
            <input class="sf-input" type="date" formControlName="endDate" />
          </label>

          <label class="sf-field">
            <span class="sf-label">Note <span class="opt">(optional)</span></span>
            <input class="sf-input" type="text" formControlName="note" maxlength="255" />
          </label>

          @if (error()) {
            <p class="sf-err" role="alert">{{ error() }}</p>
          }
        </form>
        <div modalFooter>
          <button class="sf-btn sf-btn-ghost" (click)="formOpen.set(false)">Cancel</button>
          <button class="sf-btn sf-btn-primary" form="rec-form" type="submit" [disabled]="saving()">
            {{ saving() ? 'Saving…' : editTarget() ? 'Save' : 'Create' }}
          </button>
        </div>
      </sf-modal>
    }

    @if (deleteTarget(); as target) {
      <sf-modal title="Delete schedule?" (close)="deleteTarget.set(null)">
        <p class="muted">
          “{{ target.categoryName || 'This schedule' }}” will stop running and be removed.
        </p>
        <div modalFooter>
          <button class="sf-btn sf-btn-ghost" (click)="deleteTarget.set(null)">Cancel</button>
          <button class="sf-btn sf-btn-danger" [disabled]="deleting()" (click)="confirmDelete()">
            {{ deleting() ? 'Deleting…' : 'Delete' }}
          </button>
        </div>
      </sf-modal>
    }
  `,
  styles: `
    .list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 14px;
      padding: 16px 18px;
    }
    .item.paused {
      opacity: 0.62;
    }
    .lead {
      display: flex;
      align-items: center;
      gap: 14px;
      min-width: 0;
    }
    .r-name {
      margin: 0;
      font-weight: 600;
      color: var(--color-ink);
    }
    .r-meta {
      margin: 2px 0 0;
      font-size: 12.5px;
      color: var(--color-ink-faint);
    }
    .trail {
      display: flex;
      align-items: center;
      gap: 10px;
      flex: none;
    }
    .r-amt {
      font-weight: 700;
      font-size: 16px;
    }
    .two {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    .opt {
      font-weight: 400;
      color: var(--color-ink-faint);
    }
    .muted {
      color: var(--color-ink-soft);
    }
    @media (max-width: 640px) {
      .item {
        flex-direction: column;
        align-items: stretch;
      }
      .trail {
        justify-content: flex-end;
      }
    }
  `,
})
export class RecurringPage {
  private readonly fb = inject(FormBuilder);
  private readonly recurring = inject(RecurringService);
  private readonly categoryService = inject(CategoryService);

  protected readonly formatDate = formatDate;
  protected readonly FREQ_LABEL = FREQ_LABEL;
  protected readonly frequencies = FREQUENCIES;

  protected readonly loading = signal(true);
  protected readonly items = signal<RecurringTransactionResponse[]>([]);
  protected readonly categories = signal<CategoryResponse[]>([]);

  protected readonly formOpen = signal(false);
  protected readonly editTarget = signal<RecurringTransactionResponse | null>(null);
  protected readonly deleteTarget = signal<RecurringTransactionResponse | null>(null);
  protected readonly saving = signal(false);
  protected readonly deleting = signal(false);
  protected readonly error = signal('');

  protected readonly activeCategories = computed(() =>
    this.categories().filter((c) => c.active !== false),
  );

  protected readonly form = this.fb.nonNullable.group({
    categoryId: ['', [Validators.required]],
    amount: [null as number | null, [Validators.required, Validators.min(0.01)]],
    frequency: ['MONTHLY' as RecurrenceFrequency, [Validators.required]],
    startDate: [toDateInput(), [Validators.required]],
    endDate: [''],
    executionTime: ['09:00', [Validators.required]],
    note: [''],
  });

  constructor() {
    this.categoryService.list().subscribe((list) => this.categories.set(list ?? []));
    this.load();
  }

  protected invalid(name: 'categoryId' | 'amount' | 'startDate' | 'executionTime'): boolean {
    const c = this.form.controls[name];
    return c.invalid && (c.touched || c.dirty);
  }

  protected openCreate(): void {
    this.editTarget.set(null);
    this.form.reset({
      categoryId: '',
      amount: null,
      frequency: 'MONTHLY',
      startDate: toDateInput(),
      endDate: '',
      executionTime: '09:00',
      note: '',
    });
    this.error.set('');
    this.formOpen.set(true);
  }
  protected openEdit(r: RecurringTransactionResponse): void {
    this.editTarget.set(r);
    this.form.reset({
      categoryId: r.categoryId ?? '',
      amount: r.amount ?? null,
      frequency: r.frequency ?? 'MONTHLY',
      startDate: r.startDate ?? toDateInput(),
      endDate: r.endDate ?? '',
      executionTime: r.executionTime ?? '09:00',
      note: r.note ?? '',
    });
    this.error.set('');
    this.formOpen.set(true);
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.error.set('');
    const v = this.form.getRawValue();
    const payload = {
      categoryId: v.categoryId,
      amount: v.amount!,
      frequency: v.frequency,
      startDate: v.startDate,
      endDate: v.endDate || undefined,
      executionTime: v.executionTime,
      note: v.note || undefined,
    };
    const target = this.editTarget();

    const done = {
      next: () => {
        this.saving.set(false);
        this.formOpen.set(false);
        this.load();
      },
      error: (err: unknown) => {
        this.saving.set(false);
        this.error.set('Could not save the schedule. Please check the fields and try again.');
        console.error('[recurring]', err);
      },
    };

    if (target?.id) {
      this.recurring.update(target.id, payload).subscribe(done);
    } else {
      this.recurring.create(payload).subscribe(done);
    }
  }

  protected toggle(r: RecurringTransactionResponse): void {
    if (!r.id) return;
    this.recurring.toggle(r.id).subscribe({
      next: () => this.load(),
      error: (err) => console.error('[recurring] toggle failed', err),
    });
  }

  protected askDelete(r: RecurringTransactionResponse): void {
    this.deleteTarget.set(r);
  }
  protected confirmDelete(): void {
    const id = this.deleteTarget()?.id;
    if (!id) return;
    this.deleting.set(true);
    this.recurring.delete(id).subscribe({
      next: () => {
        this.deleting.set(false);
        this.deleteTarget.set(null);
        this.load();
      },
      error: (err) => {
        this.deleting.set(false);
        console.error('[recurring] delete failed', err);
      },
    });
  }

  private load(): void {
    this.loading.set(true);
    this.recurring.upcoming().subscribe({
      next: (list) => {
        this.items.set(list ?? []);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('[recurring] load failed', err);
        this.items.set([]);
        this.loading.set(false);
      },
    });
  }
}
