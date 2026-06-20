/** Spring "Slice" envelope returned by GET /transactions. */
export interface Slice<T> {
  content?: T[];
  number?: number;
  size?: number;
  numberOfElements?: number;
  first?: boolean;
  last?: boolean;
  empty?: boolean;
}

/** Query params accepted by Spring's Pageable. */
export interface PageQuery {
  page?: number;
  size?: number;
  /** e.g. "createdAt,desc" */
  sort?: string;
}
