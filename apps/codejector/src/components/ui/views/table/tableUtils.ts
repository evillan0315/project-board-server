import { ITableColumn, Order } from './TableList';

// Comparator type for IConnection objects
export type Comparator<T> = (a: T, b: T) => number;

export function getComparator<T extends { [key: string]: any }>( 
  order: Order,
  orderBy: string, // orderBy now corresponds to ITableColumn.id (string)
  columns: ITableColumn<T>[],
): Comparator<T> {
  return (a, b) => {
    const column = columns.find(col => col.id === orderBy);
    if (!column || !column.sortable) {
      return 0; // If column is not found or not sortable, no comparison
    }

    // Use sortAccessor if provided, otherwise fallback to direct property access
    const aValue = column.sortAccessor ? column.sortAccessor(a) : (a as any)[column.id];
    const bValue = column.sortAccessor ? column.sortAccessor(b) : (b as any)[column.id];

    let comparison = 0;
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      comparison = aValue.localeCompare(bValue, undefined, { sensitivity: 'base' });
    } else if (typeof aValue === 'number' && typeof bValue === 'number') {
      comparison = aValue - bValue;
    } else if (typeof aValue === 'boolean' && typeof bValue === 'boolean') {
      comparison = (aValue === bValue) ? 0 : (aValue ? 1 : -1); // true > false
    } else {
      // Fallback for mixed types or other cases
      if (aValue < bValue) comparison = -1;
      else if (aValue > bValue) comparison = 1;
    }

    return order === 'desc' ? -comparison : comparison;
  };
}

export function stableSort<T>(array: T[], comparator: Comparator<T>) {
  const stabilizedThis = array.map((el, index) => [el, index] as [T, number]);
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) {
      return order;
    }
    return a[1] - b[1];
  });
  return stabilizedThis.map((el) => el[0]);
}
