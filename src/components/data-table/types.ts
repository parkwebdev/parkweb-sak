/**
 * @fileoverview Type definitions for data table components.
 * Provides standardized meta types for column configuration.
 */

/**
 * Column meta configuration for data tables.
 * Use this to configure column-level behavior like alignment.
 * 
 * @example
 * ```tsx
 * const columns: ColumnDef<MyData>[] = [
 *   {
 *     accessorKey: 'amount',
 *     meta: { align: 'right' } as DataTableColumnMeta,
 *     header: ({ column }) => <DataTableColumnHeader column={column} title="Amount" />,
 *     cell: ({ row }) => <span className="tabular-nums">{row.original.amount}</span>,
 *   },
 * ];
 * ```
 */
export interface DataTableColumnMeta {
  /** Text alignment for both header and cell content */
  align?: 'left' | 'center' | 'right';
}
