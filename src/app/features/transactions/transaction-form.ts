import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { CategoryService } from '../../core/api/category.service';
import { TransactionService } from '../../core/api/transaction.service';
import {
  CategoryResponse,
  TransactionResponse,
  TransactionType,
} from '../../core/models';
import { Modal } from '../../shared/ui/modal';

/**
 * Create/edit dialog for a transaction. On create the type is selectable
 * and the category list is gated by it; on edit the type is fixed (the
 * API only accepts category/amount/note updates).
 */
@Component({
  selector: 'sf-transaction-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, Modal],
  template: `
    <sf-modal [title]="editing() ? 'Edit transaction' : 'New transaction'" (close)="cancel.emit()">
      <form [formGroup]="form" (ngSubmit)="submit()" novalidate id="txn-form">
        @if (!editing()) {
          <div class="sf-field">
            <span class="sf-label">Type</span>
            <div class="seg" role="radiogroup" aria-label="Transaction type">
              <button
                type="button"
                role="radio"
                [attr.aria-checked]="type() === 'EXPENSE'"
                [class.on]="type() === 'EXPENSE'"
                (click)="setType('EXPENSE')"
              >
                Expense
              </button>
              <button
                type="button"
                role="radio"
                [attr.aria-checked]="type() === 'INCOME'"
                [class.on]="type() === 'INCOME'"
                (click)="setType('INCOME')"
              >
                Income
              </button>
            </div>
          </div>
        }

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
            <span class="sf-err">Enter an amount greater than zero.</span>
          }
        </label>

        <label class="sf-field">
          <span class="sf-label">Category</span>
          <select class="sf-select" formControlName="categoryId">
            <option value="">Uncategorized</option>
            @for (c of categoriesForType(); track c.id) {
              <option [value]="c.id">{{ c.categoryName }}</option>
            }
          </select>
        </label>

        <label class="sf-field">
          <span class="sf-label">Note</span>
          <input class="sf-input" type="text" formControlName="note" maxlength="255" />
        </label>

        @if (error()) {
          <p class="sf-err" role="alert">{{ error() }}</p>
        }
      </form>

      <div modalFooter>
        <button type="button" class="sf-btn sf-btn-ghost" (click)="cancel.emit()">Cancel</button>
        <button type="submit" form="txn-form" class="sf-btn sf-btn-primary" [disabled]="saving()">
          {{ saving() ? 'Saving…' : editing() ? 'Save changes' : 'Add transaction' }}
        </button>
      </div>
    </sf-modal>
  `,
  styles: `
    .seg {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px;
      padding: 4px;
      border: 1px solid var(--color-line);
      border-radius: var(--radius-sf);
      background: var(--color-paper);
    }
    .seg button {
      padding: 8px;
      border: none;
      border-radius: calc(var(--radius-sf) - 3px);
      background: transparent;
      color: var(--color-ink-soft);
      font: inherit;
      font-weight: 600;
      font-size: 13px;
      cursor: pointer;
    }
    .seg button.on {
      background: var(--color-accent-soft);
      color: var(--color-accent-deep);
    }
  `,
})
export class TransactionForm {
  private readonly fb = inject(FormBuilder);
  private readonly txns = inject(TransactionService);
  private readonly categoryService = inject(CategoryService);

  /** Pass a transaction to edit; omit/null for create. */
  readonly transaction = input<TransactionResponse | null>(null);
  readonly saved = output<void>();
  readonly cancel = output<void>();

  protected readonly editing = computed(() => !!this.transaction()?.id);
  protected readonly type = signal<TransactionType>('EXPENSE');
  protected readonly saving = signal(false);
  protected readonly error = signal('');
  protected readonly categories = signal<CategoryResponse[]>([]);

  protected readonly categoriesForType = computed(() =>
    this.categories().filter((c) => c.active !== false && c.transactionType === this.type()),
  );

  protected readonly form = this.fb.nonNullable.group({
    amount: [null as number | null, [Validators.required, Validators.min(0.01)]],
    categoryId: [''],
    note: [''],
  });

  constructor() {
    this.categoryService.list().subscribe((list) => this.categories.set(list ?? []));

    const t = this.transaction();
    if (t) {
      this.type.set(t.transactionType ?? 'EXPENSE');
      this.form.patchValue({
        amount: t.amount ?? null,
        categoryId: t.categoryId ?? '',
        note: t.note ?? '',
      });
    }
  }

  protected setType(t: TransactionType): void {
    this.type.set(t);
    // category list changed under us; clear a now-invalid selection
    this.form.controls.categoryId.setValue('');
  }

  protected invalid(name: 'amount'): boolean {
    const c = this.form.controls[name];
    return c.invalid && (c.touched || c.dirty);
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.error.set('');
    const { amount, categoryId, note } = this.form.getRawValue();
    const t = this.transaction();

    const done = {
      next: () => {
        this.saving.set(false);
        this.saved.emit();
      },
      error: (err: unknown) => {
        this.saving.set(false);
        this.error.set('Could not save the transaction. Please try again.');
        console.error('[transaction-form]', err);
      },
    };

    if (t?.id) {
      this.txns
        .update(t.id, { amount: amount!, categoryId: categoryId || undefined, note: note || undefined })
        .subscribe(done);
    } else {
      this.txns
        .create({
          amount: amount!,
          transactionType: this.type(),
          categoryId: categoryId || undefined,
          note: note || undefined,
          idempotencyKey: crypto.randomUUID(),
        })
        .subscribe(done);
    }
  }
}
