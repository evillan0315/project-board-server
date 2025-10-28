import React, { useState, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Table
} from '@mui/material';
import type { SxProps, Theme } from '@mui/material';

import { getComparator, stableSort } from './tableUtils';
import { TableListToolbar } from './TableListToolbar';
import { TableListHead } from './TableListHead';
import { TableListBody } from './TableListBody';
import { TableListPagination } from './TableListPagination';

// --- Interfaces and Types ---

export type Order = 'asc' | 'desc';

export interface ITableColumn<T extends { [key: string]: any }> {
  id: keyof T | string; // Can be a direct key or a custom string for computed values (e.g., 'clientDataUsername')
  label: string;
  numeric?: boolean;
  disablePadding?: boolean;
  align?: 'left' | 'right' | 'center';
  sortable?: boolean;
  // Function to render the cell content. Provides the full row object.
  render: (row: T) => React.ReactNode;
  // Optional function to extract the value used for sorting.
  // Useful for nested properties or values that need transformation before comparison.
  sortAccessor?: (row: T) => any;
  minWidth?: string | number; // For styling the column min-width
  maxWidth?: string | number; // For styling the column max-width
}

export interface IBulkAction {
  id: string; // Unique ID for the action (e.g., 'delete', 'export')
  label: string; // Tooltip label for the action button
  icon: React.ReactNode; // Icon to display for the action
  color?: 'inherit' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
  disabled?: boolean; // If the action button should be disabled
}

export interface TableListProps<T extends { [key: string]: any }> {
  data: T[];
  columns: ITableColumn<T>[];
  title?: string;
  isLoading?: boolean;
  error?: string | null;
  keyField?: keyof T; // The unique identifier field for each row, defaults to 'id'
  onRowSelect?: (selectedIds: string[]) => void; // Callback when selection changes
  onBulkAction?: (actionId: string, selectedIds: string[]) => Promise<void> | void; // Callback for bulk actions
  bulkActions?: IBulkAction[];
  initialRowsPerPage?: number;
  rowsPerPageOptions?: number[];
  searchableKeys?: Array<keyof T | string>; // Keys to search against, can include nested paths or custom identifiers
  // Optional custom filter function for complex search logic
  searchFilter?: (item: T, searchTerm: string, searchableKeys: Array<keyof T | string>) => boolean;
  emptyMessage?: string;
  noSearchResultsMessage?: string;
  tableContainerSx?: SxProps<Theme>; // Custom styles for the table container
}

// --- Component Styles (Shared from RoomConnectionsTable.tsx) ---
const defaultTableContainerSx = {
  my: 1,
  overflowY: 'auto', // Allows parent to control max-height
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: 1,
};

export function TableList<T extends { [key: string]: any }>({ 
  data,
  columns,
  title,
  isLoading = false,
  error = null,
  keyField = 'id' as keyof T,
  onRowSelect,
  onBulkAction,
  bulkActions,
  initialRowsPerPage = 5,
  rowsPerPageOptions = [5, 10, 25],
  searchableKeys = [],
  searchFilter,
  emptyMessage = 'No data available.',
  noSearchResultsMessage = 'No results found matching your search term.',
  tableContainerSx: customTableContainerSx
}: TableListProps<T>) {
  const [selected, setSelected] = useState<readonly string[]>([]);
  const [order, setOrder] = useState<Order>('asc');
  // Default sort by the first sortable column, or the keyField if no sortable columns
  const [orderBy, setOrderBy] = useState<string>(() => {
    const defaultSortColumn = columns.find(col => col.sortable);
    if (defaultSortColumn) {
      return defaultSortColumn.id.toString();
    } else if (keyField) {
      return keyField.toString();
    }
    return ''; // No default sort if no sortable column and no keyField
  });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(initialRowsPerPage);
  const [searchTerm, setSearchTerm] = useState('');
  const [isBulkActionLoading, setIsBulkActionLoading] = useState<boolean>(false);

  // Normalize data IDs to string for selection
  const normalizedData = useMemo(() => data.map(item => ({
    ...item,
    // Ensure the keyField is always a string for consistent selection handling
    // @ts-ignore - Index signature for type 'T' is missing. But we know it exists due to keyField constraint.
    idString: (item[keyField] !== undefined && item[keyField] !== null) ? String(item[keyField]) : ''
  })), [data, keyField]);

  const handleRequestSort = useCallback(
    (event: React.MouseEvent<unknown> | null, propertyId: string) => {
      const isAsc = orderBy === propertyId && order === 'asc';
      setOrder(isAsc ? 'desc' : 'asc');
      setOrderBy(propertyId);
    },
    [order, orderBy],
  );

  const defaultSearchFilter = useCallback((item: T, term: string, keys: Array<keyof T | string>): boolean => {
    const lowercasedTerm = term.toLowerCase();
    return keys.some(key => {
      // For simple properties, directly access.
      const value = (item as any)[key]; // Direct access, 'as any' for complex dynamic access not directly typed by keyof T.
      if (value !== undefined && value !== null) {
        return String(value).toLowerCase().includes(lowercasedTerm);
      }
      return false;
    });
  }, []);

  const filteredData = useMemo(() => {
    if (!searchTerm) {
      return normalizedData;
    }
    const filterFn = searchFilter || defaultSearchFilter;
    return normalizedData.filter(item => filterFn(item, searchTerm, searchableKeys));
  }, [normalizedData, searchTerm, searchableKeys, searchFilter, defaultSearchFilter]);

  const sortedData = useMemo(() => {
    if (!filteredData || filteredData.length === 0) return [];
    // Pass columns to getComparator to allow dynamic sortAccessor lookup
    return stableSort(filteredData, getComparator(order, orderBy, columns));
  }, [filteredData, order, orderBy, columns]);

  const paginatedData = useMemo(() => {
    return sortedData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [sortedData, page, rowsPerPage]);

  const handleSelectAllClick = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const newSelected = filteredData.map((n) => n.idString);
      setSelected(newSelected);
      onRowSelect?.(newSelected);
      return;
    }
    setSelected([]);
    onRowSelect?.([]);
  }, [filteredData, onRowSelect]);

  const handleRowClick = useCallback(
    (event: React.MouseEvent<unknown>, id: string) => {
      const selectedIndex = selected.indexOf(id);
      let newSelected: readonly string[] = [];

      if (selectedIndex === -1) {
        newSelected = newSelected.concat(selected, id);
      } else if (selectedIndex === 0) {
        newSelected = newSelected.concat(selected.slice(1));
      } else if (selectedIndex === selected.length - 1) {
        newSelected = newSelected.concat(selected.slice(0, -1));
      } else if (selectedIndex > 0) {
        newSelected = newSelected.concat(
          selected.slice(0, selectedIndex),
          selected.slice(selectedIndex + 1),
        );
      }
      setSelected(newSelected);
      onRowSelect?.(Array.from(newSelected));
    },
    [selected, onRowSelect],
  );

  const handleBulkActionClick = useCallback(async (actionId: string) => {
    if (selected.length === 0 || !onBulkAction) return;

    setIsBulkActionLoading(true);
    try {
      await onBulkAction(actionId, Array.from(selected));
      setSelected([]); // Clear selection after action
      onRowSelect?.([]); // Notify parent that selection is cleared
    } catch (error) {
      console.error(`Error performing bulk action '${actionId}':`, error);
      // Handle error, maybe show a snackbar
    } finally {
      setIsBulkActionLoading(false);
    }
  }, [onBulkAction, selected, onRowSelect]);

  const handleChangePage = useCallback((event: unknown, newPage: number) => {
    setPage(newPage);
  }, []);

  const handleChangeRowsPerPage = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0); // Reset to first page when rows per page changes
  }, []);

  const isSelected = useCallback((id: string) => selected.indexOf(id) !== -1, [selected]);
  const numSelected = selected.length;
  const rowCount = filteredData.length;

  const showSearch = searchableKeys.length > 0;
  const showBulkActionsToolbar = onRowSelect || (numSelected > 0 && bulkActions && bulkActions.length > 0);

  const tableListToolbarBulkActions = useMemo(() => {
    if (bulkActions) return bulkActions;
    if (onBulkAction) {
      // Default delete action if onBulkAction is provided but no custom bulkActions
      return [{ id: 'delete', label: 'Delete Selected', icon: <CircularProgress size={20} color="inherit" /> && isBulkActionLoading ? <CircularProgress size={20} color="inherit" /> : <DeleteIcon />, color: 'error', disabled: isBulkActionLoading }];
    }
    return [];
  }, [bulkActions, onBulkAction, isBulkActionLoading]);

  return (
    <Box className="w-full p-4">
      {title && (
        <Typography variant="h6" component="div" className="mb-4">
          {title}
        </Typography>
      )}

      {(showSearch || showBulkActionsToolbar) && (
        <TableListToolbar
          numSelected={numSelected}
          searchTerm={searchTerm}
          onSearchTermChange={(e) => {
            setSearchTerm(e.target.value);
            setPage(0);
          }}
          onBulkActionClick={handleBulkActionClick}
          bulkActions={tableListToolbarBulkActions}
          showSearch={showSearch}
          showBulkActionsToolbar={showBulkActionsToolbar}
        />
      )}

      {isLoading && (
        <Box className="flex justify-center items-center p-4">
          <CircularProgress size={40} />
        </Box>
      )}

      {error && (
        <Alert severity="error" className="m-4">
          {error}
        </Alert>
      )}

      {!isLoading && !error && filteredData.length === 0 && (
        <Alert severity="info" className="m-4">
          {searchTerm ? noSearchResultsMessage : emptyMessage}
        </Alert>
      )}

      {!isLoading && !error && filteredData.length > 0 && (
        <Paper sx={{...defaultTableContainerSx, ...customTableContainerSx}}>
          <Table stickyHeader size="small" aria-label="dynamic data table">
            <TableListHead
              columns={columns}
              numSelected={numSelected}
              rowCount={rowCount}
              onSelectAllClick={handleSelectAllClick}
              order={order}
              orderBy={orderBy}
              onRequestSort={handleRequestSort}
              onRowSelect={!!onRowSelect} // Convert to boolean
            />
            <TableListBody
              paginatedData={paginatedData}
              columns={columns}
              isSelected={isSelected}
              onRowClick={handleRowClick}
              onRowSelect={!!onRowSelect}
            />
          </Table>
        </Paper>
      )}
      {!isLoading && !error && filteredData.length > 0 && (
        <TableListPagination
          rowCount={rowCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={rowsPerPageOptions}
        />
      )}
    </Box>
  );
}
