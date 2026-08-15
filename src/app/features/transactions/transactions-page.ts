import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { CategoryService } from '../../core/api/category.service';
import { TransactionService } from '../../core/api/transaction.service';
import {
  CategoryResponse,
  Slice,
  TransactionFilterRequest,
  TransactionResponse,
  TransactionType,
} from '../../core/models';
import { MoneyPipe } from '../../shared/format/money.pipe';
import { formatDateTime } from '../../shared/format/dates';
import { listStagger } from '../../shared/motion/animations';
import { Icon } from '../../shared/ui/icon';
import { Modal } from '../../shared/ui/modal';
import { TransactionForm } from './transaction-form';

const PAGE_SIZE = 12;

@Component({
  selector: 'sf-transactions-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, MoneyPipe, Icon, Modal, TransactionForm],
  animations: [listStagger],
  template: `
    <header class="sf-page-head">
      <div>
        <span class="eyebrow">Ledger</span>
        <h1 class="sf-title">Transactions</h1>
        <p class="sf-subtitle">Every entry, filtered the way you need it.</p>
      </div>
      <button type="button" class="sf-btn sf-btn-primary" (click)="openCreate()">
        <sf-icon name="plus" [size]="18" /> Add transaction
      </button>
    </header>

    <div class="sf-card filters">
      <label class="f">
        <span class="sf-label">Type</span>
        <select class="sf-select" [(ngModel)]="typeFilter" (ngModelChange)="onFilterChange()">
          <option value="">All</option>
          <option value="EXPENSE">Expense</option>
          <option value="INCOME">Income</option>
        </select>
      </label>
      <label class="f">
        <span class="sf-label">Category</span>
        <select class="sf-select" [(ngModel)]="categoryFilter" (ngModelChange)="onFilterChange()">
          <option value="">All</option>
          @for (c of filterCategories(); track c.id) {
            <option [value]="c.id">{{ c.categoryName }}</option>
          }
        </select>
      </label>
      <label class="f">
        <span class="sf-label">From</span>
        <input class="sf-input" type="date" [(ngModel)]="startDate" (ngModelChange)="onFilterChange()" />
      </label>
      <label class="f">
        <span class="sf-label">To</span>
        <input class="sf-input" type="date" [(ngModel)]="endDate" (ngModelChange)="onFilterChange()" />
      </label>
      @if (hasFilters()) {
        <button type="button" class="sf-btn sf-btn-ghost sf-btn-sm clear" (click)="clearFilters()">
          Clear
        </button>
      }
    </div>

    <div class="sf-card">
      @if (loading()) {
        @for (i of [1, 2, 3, 4, 5]; track i) {
          <div class="sf-skeleton" style="height: 46px; margin-bottom: 8px"></div>
        }
      } @else if (rows().length) {
        <div class="table-wrap">
          <table class="sf-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Category</th>
                <th class="right">Amount</th>
                <th class="right">Actions</th>
              </tr>
            </thead>
            <tbody [@listStagger]="rows().length">
              @for (t of rows(); track t.id) {
                <tr>
                  <td class="num date">{{ formatDateTime(t.createdAt) }}</td>
                  <td>
                    <span class="note">{{ t.note || '—' }}</span>
                    @if (t.isOverBudget) {
                      <span class="warn" [title]="t.warningMessage || 'Over budget'">
                        <sf-icon name="target" [size]="13" /> Over budget
                      </span>
                    }
                  </td>
                  <td>
                    <span
                      class="sf-chip"
                      [class.sf-chip-income]="t.transactionType === 'INCOME'"
                      [class.sf-chip-expense]="t.transactionType === 'EXPENSE'"
                      >{{ t.categoryName || 'Uncategorized' }}</span
                    >
                  </td>
                  <td
                    class="num right amount"
                    [class.sf-pos]="t.transactionType === 'INCOME'"
                    [class.sf-neg]="t.transactionType === 'EXPENSE'"
                  >
                    {{ t.transactionType === 'INCOME' ? '+' : '−'
                    }}{{ t.amount | money }}
                  </td>
                  <td class="right">
                    <div class="actions">
                      <button class="sf-icon-btn" aria-label="Edit" (click)="openEdit(t)">
                        <sf-icon name="edit" [size]="16" />
                      </button>
                      <button class="sf-icon-btn" aria-label="Delete" (click)="askDelete(t)">
                        <sf-icon name="trash" [size]="16" />
                      </button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <div class="pager">
          <button
            class="sf-btn sf-btn-ghost sf-btn-sm"
            [disabled]="slice()?.first"
            (click)="prevPage()"
          >
            <sf-icon name="chevron-left" [size]="16" /> Previous
          </button>
          <span class="pager-info num">Page {{ (slice()?.number ?? 0) + 1 }}</span>
          <button
            class="sf-btn sf-btn-ghost sf-btn-sm"
            [disabled]="slice()?.last"
            (click)="nextPage()"
          >
            Next <sf-icon name="chevron-right" [size]="16" />
          </button>
        </div>
      } @else {
        <div class="sf-empty">
          <sf-icon name="inbox" [size]="30" />
          <p class="sf-empty-title">No transactions yet</p>
          <p>{{ hasFilters() ? 'Try widening your filters.' : 'Add your first transaction to get started.' }}</p>
        </div>
      }
    </div>

    @if (formOpen()) {
      <sf-transaction-form
        [transaction]="editTarget()"
        (saved)="onSaved()"
        (cancel)="formOpen.set(false)"
      />
    }

    @if (deleteTarget(); as target) {
      <sf-modal title="Delete transaction?" (close)="deleteTarget.set(null)">
        <p class="confirm-text">
          This will permanently remove the
          {{ target.transactionType === 'INCOME' ? 'income' : 'expense' }} of
          <strong>{{ target.amount | money }}</strong
          >{{ target.note ? ' — “' + target.note + '”' : '' }}.
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
    .filters {
      display: flex;
      gap: 14px;
      align-items: flex-end;
      flex-wrap: wrap;
      margin-bottom: 18px;
    }
    .f {
      display: block;
      min-width: 150px;
      flex: 1;
    }
    .f .sf-label {
      margin-bottom: 4px;
    }
    .clear {
      margin-bottom: 1px;
    }
    .table-wrap {
      overflow-x: auto;
    }
    .right {
      text-align: right;
    }
    .date {
      color: var(--color-ink-soft);
      font-size: 12.5px;
      white-space: nowrap;
    }
    .note {
      font-weight: 500;
    }
    .warn {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      margin-left: 8px;
      font-size: 11px;
      color: var(--color-expense);
    }
    .amount {
      font-weight: 600;
      white-space: nowrap;
    }
    .actions {
      display: inline-flex;
      gap: 6px;
      justify-content: flex-end;
    }
    .pager {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 16px;
      margin-top: 16px;
    }
    .pager-info {
      font-size: 13px;
      color: var(--color-ink-soft);
    }
    .confirm-text {
      margin: 0;
      color: var(--color-ink-soft);
      line-height: 1.6;
    }
  `,
})
export class TransactionsPage {
  private readonly txns = inject(TransactionService);
  private readonly categoryService = inject(CategoryService);

  protected readonly formatDateTime = formatDateTime;

  protected typeFilter: '' | TransactionType = '';
  protected categoryFilter = '';
  protected startDate = '';
  protected endDate = '';

  protected readonly loading = signal(true);
  protected readonly slice = signal<Slice<TransactionResponse> | null>(null);
  protected readonly page = signal(0);
  protected readonly categories = signal<CategoryResponse[]>([]);

  protected readonly formOpen = signal(false);
  protected readonly editTarget = signal<TransactionResponse | null>(null);
  protected readonly deleteTarget = signal<TransactionResponse | null>(null);
  protected readonly deleting = signal(false);

  protected readonly rows = computed(() => this.slice()?.content ?? []);
  protected readonly filterCategories = computed(() =>
    this.categories().filter((c) => !this.typeFilter || c.transactionType === this.typeFilter),
  );

  constructor() {
    this.categoryService.list().subscribe((list) => this.categories.set(list ?? []));
    this.load();
  }

  protected hasFilters(): boolean {
    return !!(this.typeFilter || this.categoryFilter || this.startDate || this.endDate);
  }

  protected onFilterChange(): void {
    this.page.set(0);
    this.load();
  }

  protected clearFilters(): void {
    this.typeFilter = '';
    this.categoryFilter = '';
    this.startDate = '';
    this.endDate = '';
    this.onFilterChange();
  }

  protected prevPage(): void {
    if (!this.slice()?.first) {
      this.page.update((p) => Math.max(0, p - 1));
      this.load();
    }
  }
  protected nextPage(): void {
    if (!this.slice()?.last) {
      this.page.update((p) => p + 1);
      this.load();
    }
  }

  protected openCreate(): void {
    this.editTarget.set(null);
    this.formOpen.set(true);
  }
  protected openEdit(t: TransactionResponse): void {
    this.editTarget.set(t);
    this.formOpen.set(true);
  }
  protected onSaved(): void {
    this.formOpen.set(false);
    this.load();
  }

  protected askDelete(t: TransactionResponse): void {
    this.deleteTarget.set(t);
  }
  protected confirmDelete(): void {
    const id = this.deleteTarget()?.id;
    if (!id) return;
    this.deleting.set(true);
    this.txns.delete(id).subscribe({
      next: () => {
        this.deleting.set(false);
        this.deleteTarget.set(null);
        this.load();
      },
      error: (err) => {
        this.deleting.set(false);
        console.error('[transactions] delete failed', err);
      },
    });
  }

  private load(): void {
    this.loading.set(true);
    const filter: TransactionFilterRequest = {
      transactionType: this.typeFilter || undefined,
      categoryId: this.categoryFilter || undefined,
      startDate: this.startDate ? new Date(this.startDate).toISOString() : undefined,
      endDate: this.endDate ? new Date(this.endDate + 'T23:59:59').toISOString() : undefined,
    };
    this.txns
      .list(filter, { page: this.page(), size: PAGE_SIZE, sort: 'createdAt,desc' })
      .subscribe({
        next: (slice) => {
          this.slice.set(slice);
          this.loading.set(false);
        },
        error: (err) => {
          console.error('[transactions] load failed', err);
          this.slice.set({ content: [], empty: true, first: true, last: true });
          this.loading.set(false);
        },
      });
  }
}
