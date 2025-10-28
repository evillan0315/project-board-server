import React from 'react';
import {
  Checkbox,
  TableCell,
  TableBody,
  TableRow,
} from '@mui/material';
import { ITableColumn } from './TableList';

interface TableListBodyProps<T extends { [key: string]: any }> {
  paginatedData: (T & { idString: string })[];
  columns: ITableColumn<T>[];
  isSelected: (id: string) => boolean;
  onRowClick: (event: React.MouseEvent<unknown>, id: string) => void;
  onRowSelect: boolean; // Indicates if row selection is enabled
}

export function TableListBody<T extends { [key: string]: any }>({ 
  paginatedData,
  columns,
  isSelected,
  onRowClick,
  onRowSelect,
}: TableListBodyProps<T>) {
  return (
    <TableBody>
      {paginatedData.map((row) => {
        const idString = row.idString; // Use the normalized string ID
        const isItemSelected = isSelected(idString);
        const labelId = `enhanced-table-checkbox-${idString}`;

        return (
          <TableRow
            hover
            onClick={(event) => onRowSelect && onRowClick(event, idString)} // Only clickable for selection
            role={onRowSelect ? 'checkbox' : 'row'}
            aria-checked={isItemSelected}
            tabIndex={-1}
            key={idString}
            selected={isItemSelected}
            sx={{ cursor: onRowSelect ? 'pointer' : 'default' }}
          >
            {onRowSelect && (
              <TableCell padding="checkbox">
                <Checkbox
                  color="primary"
                  checked={isItemSelected}
                  inputProps={{ 'aria-labelledby': labelId }}
                />
              </TableCell>
            )}
            {columns.map((column) => (
              <TableCell
                key={column.id.toString()}
                align={column.align || (column.numeric ? 'right' : 'left')}
                sx={{
                  minWidth: column.minWidth,
                  maxWidth: column.maxWidth,
                  width: column.minWidth || column.maxWidth,
                  // Truncate text if max-width is set
                  ...(column.maxWidth && {
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'wrap'
                  })
                }}
                className="truncate max-w-45"
              >
                {column.render(row)}
              </TableCell>
            ))}
          </TableRow>
        );
      })}
    </TableBody>
  );
}
