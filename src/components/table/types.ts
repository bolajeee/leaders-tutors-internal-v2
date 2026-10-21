export type SortDirection = "asc" | "desc" | null;

interface TableColumnBase<T> {
  header: string | ((props: { column: TableColumn<T> }) => React.ReactNode);
  cell?: (props: {
    row: {
      original: T;
      getValue: <K extends keyof T>(key: K) => T[K];
      getIsSelected: () => boolean;
      toggleSelected: (checked: boolean) => void;
    };
  }) => React.ReactNode;
  sortable?: boolean;
  width?: string | number;
  align?: "left" | "center" | "right";
}

export type TableColumn<T> =
  | ({ accessorKey: keyof T; id?: undefined } & TableColumnBase<T>)
  | ({ id: string; accessorKey?: null } & TableColumnBase<T>);

export interface TableState {
  sortKey: string | null;
  sortDirection: SortDirection;
}

export interface StickyColumnsConfig {
  first?: boolean;
  last?: boolean;
}

export type TableProps<T> = {
  data: T[];
  columns: TableColumn<T>[];
  onRowClick?: (row: T) => void;
  noDataMessage?: string | React.ReactNode;
  isLoading?: boolean;
  onSort?: (key: keyof T, direction: SortDirection) => void;
  initialSortState?: TableState;
  stickyColumns?: StickyColumnsConfig;
};
