import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

import { BudgetService } from '../../core/api/budget.service';
import { CategoryService } from '../../core/api/category.service';
import { BudgetResponse, BudgetSummaryResponse, CategoryResponse } from '../../core/models';
import { MoneyPipe } from '../../shared/format/money.pipe';
import { monthLabel } from '../../shared/format/dates';
import { fadeRise } from '../../shared/motion/animations';
import { Icon } from '../../shared/ui/icon';
import { Modal } from '../../shared/ui/modal';

interface BudgetEntry {
  budget: BudgetResponse;
  summary: BudgetSummaryResponse;
}

@Component({
  selector: 'sf-budgets-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, MoneyPipe, Icon, Modal],
  animations: [fadeRise],
  template: `
    <header class="sf-page-head">
      <div>
        <span class="eyebrow">Limits</span>
        <h1 class="sf-title">Budgets</h1>
        <p class="sf-subtitle">Set a monthly ceiling per category and watch how close you are.</p>
      </div>
      <button type="button" class="sf-btn sf-btn-primary" (click)="openCreate()">
        <sf-icon name="plus" [size]="18" /> New budget
      </button>
    </header>

    @if (loading()) {
      <div class="grid">
        @for (i of [1, 2, 3]; track i) {
          <div class="sf-skeleton" style="height: 150px"></div>
        }
      </div>
    } @else if (entries().length) {
      <div class="grid">
        @for (e of entries(); track e.budget.id) {
          <article class="sf-card budget" @fadeRise>
            <header class="b-head">
              <div>
                <h2 class="b-name">{{ e.summary.categoryName || categoryName(e.budget.categoryId) }}</h2>
                <span class="b-period">{{ monthLabel(e.budget.month ?? 0) }} {{ e.budget.year }}</span>
              </div>
              <div class="b-actions">
                <button class="sf-icon-btn" aria-label="Edit limit" (click)="openEdit(e)">
                  <sf-icon name="edit" [size]="16" />
                </button>
                <button class="sf-icon-btn" aria-label="Delete budget" (click)="askDelete(e)">
                  <sf-icon name="trash" [size]="16" />
                </button>
              </div>
            </header>

            <div class="meter" [attr.aria-label]="meterLabel(e)">
              <div
                class="fill"
                [class.warn]="state(e) === 'warn'"
                [class.over]="state(e) === 'over'"
                [style.width.%]="barWidth(e)"
              ></div>
            </div>

            <div class="b-figures">
              <span class="num spent" [class.sf-neg]="e.summary.isOverBudget">
                {{ e.summary.spentAmount | money }}
              </span>
              <span class="of">of {{ e.summary.amountLimit | money }}</span>
            </div>
            <p class="b-foot" [class.sf-neg]="e.summary.isOverBudget">
              @if (e.summary.isOverBudget) {
                {{ over(e) | money }} over budget
              } @else {
                {{ e.summary.remaining | money }} remaining
              }
            </p>
          </article>
        }
      </div>
    } @else {
      <div class="sf-card sf-empty">
        <sf-icon name="target" [size]="30" />
        <p class="sf-empty-title">No budgets set</p>
        <p>Create a budget to start tracking a category against a monthly limit.</p>
      </div>
    }

    @if (formOpen()) {
      <sf-modal [title]="editTarget() ? 'Edit budget' : 'New budget'" (close)="formOpen.set(false)">
        <form [formGroup]="form" (ngSubmit)="submit()" novalidate id="budget-form">
          @if (!editTarget()) {
            <label class="sf-field">
              <span class="sf-label">Category</span>
              <select class="sf-select" formControlName="categoryId" [class.invalid]="invalid('categoryId')">
                <option value="">Choose a category</option>
                @for (c of expenseCategories(); track c.id) {
                  <option [value]="c.id">{{ c.categoryName }}</option>
                }
              </select>
              @if (invalid('categoryId')) {
                <span class="sf-err">Choose a category.</span>
              }
            </label>
            <div class="two">
              <label class="sf-field">
                <span class="sf-label">Month</span>
                <select class="sf-select" formControlName="month">
                  @for (m of months; track m) {
                    <option [value]="m">{{ monthLabel(m) }}</option>
                  }
                </select>
              </label>
              <label class="sf-field">
                <span class="sf-label">Year</span>
                <input class="sf-input" type="number" formControlName="year" />
              </label>
            </div>
          }
          <label class="sf-field">
            <span class="sf-label">Monthly limit</span>
            <input
              class="sf-input"
              type="number"
              step="0.01"
              min="0"
              formControlName="amountLimit"
              [class.invalid]="invalid('amountLimit')"
            />
            @if (invalid('amountLimit')) {
              <span class="sf-err">Enter a limit greater than zero.</span>
            }
          </label>
          @if (error()) {
            <p class="sf-err" role="alert">{{ error() }}</p>
          }
        </form>
        <div modalFooter>
          <button class="sf-btn sf-btn-ghost" (click)="formOpen.set(false)">Cancel</button>
          <button class="sf-btn sf-btn-primary" form="budget-form" type="submit" [disabled]="saving()">
            {{ saving() ? 'Saving…' : editTarget() ? 'Save' : 'Create' }}
          </button>
        </div>
      </sf-modal>
    }

    @if (deleteTarget(); as target) {
      <sf-modal title="Delete budget?" (close)="deleteTarget.set(null)">
        <p class="muted">
          The {{ monthLabel(target.budget.month ?? 0) }} {{ target.budget.year }} budget for
          “{{ target.summary.categoryName }}” will be removed.
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
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 18px;
    }
    .budget {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .b-head {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 8px;
    }
    .b-name {
      margin: 0;
      font-family: var(--font-display);
      font-size: 16px;
      font-weight: 700;
      color: var(--color-ink);
    }
    .b-period {
      font-family: var(--font-mono);
      font-size: 10.5px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--color-ink-faint);
    }
    .b-actions {
      display: inline-flex;
      gap: 6px;
    }
    .meter {
      height: 10px;
      border-radius: 999px;
      background: var(--color-surface-2);
      overflow: hidden;
    }
    .fill {
      height: 100%;
      border-radius: 999px;
      background: var(--color-income);
      transition: width 0.9s var(--ease-sf, ease);
    }
    .fill.warn {
      background: var(--color-warn);
    }
    .fill.over {
      background: var(--color-expense);
    }
    .b-figures {
      display: flex;
      align-items: baseline;
      gap: 6px;
    }
    .spent {
      font-size: 22px;
      font-weight: 700;
      color: var(--color-ink);
    }
    .of {
      font-size: 13px;
      color: var(--color-ink-soft);
    }
    .b-foot {
      margin: 0;
      font-size: 13px;
      color: var(--color-ink-soft);
    }
    .two {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    .muted {
      color: var(--color-ink-soft);
    }
  `,
})
export class BudgetsPage {
  private readonly fb = inject(FormBuilder);
  private readonly budgets = inject(BudgetService);
  private readonly categoryService = inject(CategoryService);

  protected readonly monthLabel = monthLabel;
  protected readonly months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  protected readonly loading = signal(true);
  protected readonly entries = signal<BudgetEntry[]>([]);
  protected readonly categories = signal<CategoryResponse[]>([]);

  protected readonly formOpen = signal(false);
  protected readonly editTarget = signal<BudgetEntry | null>(null);
  protected readonly deleteTarget = signal<BudgetEntry | null>(null);
  protected readonly saving = signal(false);
  protected readonly deleting = signal(false);
  protected readonly error = signal('');

  protected readonly expenseCategories = computed(() =>
    this.categories().filter((c) => c.active !== false && c.transactionType === 'EXPENSE'),
  );

  protected readonly form = this.fb.nonNullable.group({
    categoryId: ['', [Validators.required]],
    month: [new Date().getMonth() + 1, [Validators.required]],
    year: [new Date().getFullYear(), [Validators.required]],
    amountLimit: [null as number | null, [Validators.required, Validators.min(0.01)]],
  });

  constructor() {
    this.load();
  }

  protected categoryName(id?: string): string {
    return this.categories().find((c) => c.id === id)?.categoryName ?? 'Category';
  }
  protected barWidth(e: BudgetEntry): number {
    return Math.min(100, e.summary.progressPercentage ?? 0);
  }
  protected state(e: BudgetEntry): 'ok' | 'warn' | 'over' {
    if (e.summary.isOverBudget) return 'over';
    return (e.summary.progressPercentage ?? 0) >= 90 ? 'warn' : 'ok';
  }
  protected over(e: BudgetEntry): number {
    return (e.summary.spentAmount ?? 0) - (e.summary.amountLimit ?? 0);
  }
  protected meterLabel(e: BudgetEntry): string {
    return `${Math.round(e.summary.progressPercentage ?? 0)}% of limit used`;
  }

  protected invalid(name: 'categoryId' | 'amountLimit'): boolean {
    const c = this.form.controls[name];
    return c.invalid && (c.touched || c.dirty);
  }

  protected openCreate(): void {
    this.editTarget.set(null);
    this.form.reset({
      categoryId: '',
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      amountLimit: null,
    });
    this.error.set('');
    this.formOpen.set(true);
  }
  protected openEdit(e: BudgetEntry): void {
    this.editTarget.set(e);
    this.form.reset({
      categoryId: e.budget.categoryId ?? '',
      month: e.budget.month ?? 1,
      year: e.budget.year ?? new Date().getFullYear(),
      amountLimit: e.budget.amountLimit ?? null,
    });
    this.error.set('');
    this.formOpen.set(true);
  }

  protected submit(): void {
    const editing = this.editTarget();
    if (editing) {
      this.form.controls.categoryId.clearValidators();
      this.form.controls.categoryId.updateValueAndValidity({ emitEvent: false });
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.error.set('');
    const v = this.form.getRawValue();

    const done = {
      next: () => {
        this.saving.set(false);
        this.formOpen.set(false);
        this.load();
      },
      error: (err: unknown) => {
        this.saving.set(false);
        this.error.set('Could not save the budget. A budget for this category/month may already exist.');
        console.error('[budgets]', err);
      },
    };

    if (editing?.budget.id) {
      this.budgets.update(editing.budget.id, { amountLimit: v.amountLimit! }).subscribe(done);
    } else {
      this.budgets
        .create({
          categoryId: v.categoryId,
          month: Number(v.month),
          year: Number(v.year),
          amountLimit: v.amountLimit!,
        })
        .subscribe(done);
    }
  }

  protected askDelete(e: BudgetEntry): void {
    this.deleteTarget.set(e);
  }
  protected confirmDelete(): void {
    const id = this.deleteTarget()?.budget.id;
    if (!id) return;
    this.deleting.set(true);
    this.budgets.delete(id).subscribe({
      next: () => {
        this.deleting.set(false);
        this.deleteTarget.set(null);
        this.load();
      },
      error: (err) => {
        this.deleting.set(false);
        console.error('[budgets] delete failed', err);
      },
    });
  }

  /** Budgets are scoped per category by the API, so fan out across all
      expense categories, then resolve each budget's summary. */
  private load(): void {
    this.loading.set(true);
    this.categoryService
      .list()
      .pipe(
        switchMap((cats) => {
          this.categories.set(cats ?? []);
          const expense = (cats ?? []).filter(
            (c) => c.active !== false && c.transactionType === 'EXPENSE' && c.id,
          );
          if (!expense.length) {
            return of([] as BudgetResponse[]);
          }
          return forkJoin(expense.map((c) => this.budgets.listByCategory(c.id!))).pipe(
            map((lists) => lists.flat()),
          );
        }),
        switchMap((budgets) => {
          const withId = budgets.filter((b) => b.id);
          if (!withId.length) {
            return of([] as BudgetEntry[]);
          }
          return forkJoin(
            withId.map((b) =>
              this.budgets.summary(b.id!).pipe(map((summary) => ({ budget: b, summary }))),
            ),
          );
        }),
      )
      .subscribe({
        next: (entries) => {
          this.entries.set(entries);
          this.loading.set(false);
        },
        error: (err) => {
          console.error('[budgets] load failed', err);
          this.entries.set([]);
          this.loading.set(false);
        },
      });
  }
}
