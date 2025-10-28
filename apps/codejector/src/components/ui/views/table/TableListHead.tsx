import React from 'react';
import {
  Box,
  Checkbox,
  TableCell,
  TableHead,
  TableRow,
  TableSortLabel,
} from '@mui/material';
import { ITableColumn, Order } from './TableList';

interface TableListHeadProps<T extends { [key: string]: any }> {
  columns: ITableColumn<T>[];
  numSelected: number;
  rowCount: number;
  onSelectAllClick: (event: React.ChangeEvent<HTMLInputElement>) => void;
  order: Order;
  orderBy: string;
  onRequestSort: (event: React.MouseEvent<unknown> | null, propertyId: string) => void;
  onRowSelect: boolean; // Indicates if row selection is enabled
}

// --- Component Styles ---
const headerCellSx = {
  fontWeight: 'bold',
  backgroundColor: 'background.paper',
  position: 'sticky',
  top: 0,
  zIndex: 1,
  whiteSpace: 'nowrap',
};

export function TableListHead<T extends { [key: string]: any }>({ 
  columns,
  numSelected,
  rowCount,
  onSelectAllClick,
  order,
  orderBy,
  onRequestSort,
  onRowSelect,
}: TableListHeadProps<T>) {
  const createSortHandler = (propertyId: string) => (event: React.MouseEvent<unknown> | null) => {
    onRequestSort(event, propertyId);
  };

  return (
    <TableHead>
      <TableRow>
        {onRowSelect && (
          <TableCell padding="checkbox" sx={headerCellSx}>
            <Checkbox
              color="primary"
              indeterminate={numSelected > 0 && numSelected < rowCount}
              checked={rowCount > 0 && numSelected === rowCount}
              onChange={onSelectAllClick}
              inputProps={{ 'aria-label': 'select all items' }}
            />
          </TableCell>
        )}
        {columns.map((column) => (
          <TableCell
            key={column.id.toString()}
            align={column.align || (column.numeric ? 'right' : 'left')}
            padding={column.disablePadding ? 'none' : 'normal'}
            sortDirection={orderBy === column.id.toString() ? order : false}
            sx={{
              ...headerCellSx,
              minWidth: column.minWidth,
              maxWidth: column.maxWidth,
              width: column.minWidth || column.maxWidth // Apply width if defined
            }}
          >
            {column.sortable ? (
              <TableSortLabel
                active={orderBy === column.id.toString()}
                direction={orderBy === column.id.toString() ? order : 'asc'}
                onClick={createSortHandler(column.id.toString())}
              >
                {column.label}
                {orderBy === column.id.toString() ? (
                  <Box component="span" sx={{ position: 'absolute', clip: 'rect(0 0 0 0)', width: 1, height: 1, margin: -1, padding: 0, overflow: 'hidden' }}>
                    {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                  </Box>
                ) : null}
              </TableSortLabel>
            ) : (
              column.label
            )}
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );
}
