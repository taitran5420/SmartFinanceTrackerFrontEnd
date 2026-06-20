import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { CategoryService } from '../../core/api/category.service';
import { CategoryResponse, TransactionType } from '../../core/models';
import { listStagger } from '../../shared/motion/animations';
import { Icon } from '../../shared/ui/icon';
import { Modal } from '../../shared/ui/modal';

@Component({
  selector: 'sf-categories-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, Icon, Modal],
  animations: [listStagger],
  template: `
    <header class="sf-page-head">
      <div>
        <span class="eyebrow">Organize</span>
        <h1 class="sf-title">Categories</h1>
        <p class="sf-subtitle">Group your income and spending so the numbers tell a story.</p>
      </div>
      <button type="button" class="sf-btn sf-btn-primary" (click)="openCreate()">
        <sf-icon name="plus" [size]="18" /> New category
      </button>
    </header>

    @if (loading()) {
      <div class="cols">
        <div class="sf-skeleton" style="height: 240px"></div>
        <div class="sf-skeleton" style="height: 240px"></div>
      </div>
    } @else {
      <div class="cols">
        @for (group of groups(); track group.type) {
          <section class="sf-card">
            <h2 class="sf-card-title">
              <span
                class="sf-chip"
                [class.sf-chip-income]="group.type === 'INCOME'"
                [class.sf-chip-expense]="group.type === 'EXPENSE'"
                >{{ group.type === 'INCOME' ? 'Income' : 'Expense' }}</span
              >
            </h2>
            @if (group.items.length) {
              <ul class="list" [@listStagger]="group.items.length">
                @for (c of group.items; track c.id) {
                  <li class="row">
                    <span class="name">{{ c.categoryName }}</span>
                    <div class="row-actions">
                      <button class="sf-icon-btn" aria-label="Rename" (click)="openEdit(c)">
                        <sf-icon name="edit" [size]="16" />
                      </button>
                      <button class="sf-icon-btn" aria-label="Deactivate" (click)="askDelete(c)">
                        <sf-icon name="trash" [size]="16" />
                      </button>
                    </div>
                  </li>
                }
              </ul>
            } @else {
              <p class="muted">No {{ group.type === 'INCOME' ? 'income' : 'expense' }} categories yet.</p>
            }
          </section>
        }
      </div>
    }

    @if (formOpen()) {
      <sf-modal [title]="editTarget() ? 'Rename category' : 'New category'" (close)="formOpen.set(false)">
        <form [formGroup]="form" (ngSubmit)="submit()" novalidate id="cat-form">
          <label class="sf-field">
            <span class="sf-label">Name</span>
            <input
              class="sf-input"
              type="text"
              formControlName="categoryName"
              [class.invalid]="invalid()"
            />
            @if (invalid()) {
              <span class="sf-err">Enter a category name.</span>
            }
          </label>

          @if (!editTarget()) {
            <div class="sf-field">
              <span class="sf-label">Type</span>
              <div class="seg" role="radiogroup" aria-label="Category type">
                <button
                  type="button"
                  role="radio"
                  [attr.aria-checked]="type() === 'EXPENSE'"
                  [class.on]="type() === 'EXPENSE'"
                  (click)="type.set('EXPENSE')"
                >
                  Expense
                </button>
                <button
                  type="button"
                  role="radio"
                  [attr.aria-checked]="type() === 'INCOME'"
                  [class.on]="type() === 'INCOME'"
                  (click)="type.set('INCOME')"
                >
                  Income
                </button>
              </div>
            </div>
          }
          @if (error()) {
            <p class="sf-err" role="alert">{{ error() }}</p>
          }
        </form>
        <div modalFooter>
          <button class="sf-btn sf-btn-ghost" (click)="formOpen.set(false)">Cancel</button>
          <button class="sf-btn sf-btn-primary" form="cat-form" type="submit" [disabled]="saving()">
            {{ saving() ? 'Saving…' : editTarget() ? 'Save' : 'Create' }}
          </button>
        </div>
      </sf-modal>
    }

    @if (deleteTarget(); as target) {
      <sf-modal title="Deactivate category?" (close)="deleteTarget.set(null)">
        <p class="muted">
          “{{ target.categoryName }}” will be deactivated. Existing transactions keep their history.
        </p>
        <div modalFooter>
          <button class="sf-btn sf-btn-ghost" (click)="deleteTarget.set(null)">Cancel</button>
          <button class="sf-btn sf-btn-danger" [disabled]="deleting()" (click)="confirmDelete()">
            {{ deleting() ? 'Working…' : 'Deactivate' }}
          </button>
        </div>
      </sf-modal>
    }
  `,
  styles: `
    .cols {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 18px;
    }
    @media (max-width: 760px) {
      .cols {
        grid-template-columns: 1fr;
      }
    }
    .list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      padding: 10px 12px;
      border-radius: var(--radius-sf);
      background: var(--color-surface-2);
    }
    .name {
      font-weight: 500;
      color: var(--color-ink);
    }
    .row-actions {
      display: inline-flex;
      gap: 6px;
    }
    .muted {
      color: var(--color-ink-soft);
      font-size: 14px;
    }
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
export class CategoriesPage {
  private readonly fb = inject(FormBuilder);
  private readonly categoryService = inject(CategoryService);

  protected readonly loading = signal(true);
  protected readonly categories = signal<CategoryResponse[]>([]);

  protected readonly formOpen = signal(false);
  protected readonly editTarget = signal<CategoryResponse | null>(null);
  protected readonly deleteTarget = signal<CategoryResponse | null>(null);
  protected readonly type = signal<TransactionType>('EXPENSE');
  protected readonly saving = signal(false);
  protected readonly deleting = signal(false);
  protected readonly error = signal('');

  protected readonly form = this.fb.nonNullable.group({
    categoryName: ['', [Validators.required, Validators.minLength(1)]],
  });

  protected readonly groups = computed(() => {
    const active = this.categories().filter((c) => c.active !== false);
    return [
      { type: 'EXPENSE' as const, items: active.filter((c) => c.transactionType === 'EXPENSE') },
      { type: 'INCOME' as const, items: active.filter((c) => c.transactionType === 'INCOME') },
    ];
  });

  constructor() {
    this.load();
  }

  protected invalid(): boolean {
    const c = this.form.controls.categoryName;
    return c.invalid && (c.touched || c.dirty);
  }

  protected openCreate(): void {
    this.editTarget.set(null);
    this.type.set('EXPENSE');
    this.form.reset({ categoryName: '' });
    this.error.set('');
    this.formOpen.set(true);
  }
  protected openEdit(c: CategoryResponse): void {
    this.editTarget.set(c);
    this.form.reset({ categoryName: c.categoryName ?? '' });
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
    const name = this.form.getRawValue().categoryName.trim();
    const target = this.editTarget();

    const done = {
      next: () => {
        this.saving.set(false);
        this.formOpen.set(false);
        this.load();
      },
      error: (err: unknown) => {
        this.saving.set(false);
        this.error.set('Could not save the category. The name may already exist.');
        console.error('[categories]', err);
      },
    };

    if (target?.id) {
      this.categoryService.update(target.id, { categoryName: name }).subscribe(done);
    } else {
      this.categoryService.create({ categoryName: name, transactionType: this.type() }).subscribe(done);
    }
  }

  protected askDelete(c: CategoryResponse): void {
    this.deleteTarget.set(c);
  }
  protected confirmDelete(): void {
    const id = this.deleteTarget()?.id;
    if (!id) return;
    this.deleting.set(true);
    this.categoryService.delete(id).subscribe({
      next: () => {
        this.deleting.set(false);
        this.deleteTarget.set(null);
        this.load();
      },
      error: (err) => {
        this.deleting.set(false);
        console.error('[categories] deactivate failed', err);
      },
    });
  }

  private load(): void {
    this.loading.set(true);
    this.categoryService.list().subscribe({
      next: (list) => {
        this.categories.set(list ?? []);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('[categories] load failed', err);
        this.categories.set([]);
        this.loading.set(false);
      },
    });
  }
}
