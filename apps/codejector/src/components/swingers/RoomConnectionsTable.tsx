import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useStore } from '@nanostores/react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  Tooltip,
  Checkbox,
  IconButton,
  Toolbar,
  TableSortLabel,
  TablePagination,
  TextField,
  InputAdornment,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccessTimeFilledIcon from '@mui/icons-material/AccessTimeFilled';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import { IConnection, IClientConnectionUserData } from '@/components/swingers/types';
import { deleteConnection } from '@/components/swingers/api/connections';
import { connectionStore, fetchSessionConnections, deleteConnectionsFromStore } from '@/components/swingers/stores/connectionStore';

interface RoomConnectionsTableProps {
  roomId: string;
}

// --- Interfaces and Types for Sorting ---
interface HeadCell {
  id: ConnectionKeys;
  numeric: boolean;
  disablePadding: boolean;
  label: string;
}

type Order = 'asc' | 'desc';

// Define sortable keys explicitly, including properties from IConnection and parsed clientData
type ConnectionKeys =
  | keyof IConnection
  | 'clientDataUsername'
  | 'clientDataUserId';

// --- Sorting Helper Functions ---

// Comparator type for IConnection objects
type Comparator<T> = (a: T, b: T) => number;

function getComparator(
  order: Order,
  orderBy: ConnectionKeys,
  parseClientData: (json: string) => IClientConnectionUserData | null,
): Comparator<IConnection> {
  return (a, b) => {
    let aValue: any;
    let bValue: any;

    if (orderBy === 'clientDataUsername') {
      aValue = parseClientData(a.clientData)?.USERNAME || '';
      bValue = parseClientData(b.clientData)?.USERNAME || '';
    } else if (orderBy === 'clientDataUserId') {
      aValue = parseClientData(a.clientData)?.USERID || 0;
      bValue = parseClientData(b.clientData)?.USERID || 0;
    } else {
      // Direct property from IConnection
      // Safely cast orderBy to keyof IConnection as it's guaranteed by type if not clientData specific
      aValue = a[orderBy as keyof IConnection];
      bValue = b[orderBy as keyof IConnection];
    }

    let comparison = 0;
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      comparison = aValue.localeCompare(bValue);
    } else if (typeof aValue === 'number' && typeof bValue === 'number') {
      comparison = aValue - bValue;
    } else {
      // Fallback for mixed types or other cases, though should be type-guarded by orderBy
      if (aValue < bValue) comparison = -1;
      else if (aValue > bValue) comparison = 1;
    }

    return order === 'desc' ? -comparison : comparison;
  };
}

function stableSort<T>(array: T[], comparator: Comparator<T>) {
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

// --- Component Styles ---
const tableContainerSx = {
  my: 1,
  maxHeight: '400px',
  overflowY: 'auto',
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: 1,
};

const headerCellSx = {
  fontWeight: 'bold',
  backgroundColor: 'background.paper',
  position: 'sticky',
  top: 0,
  zIndex: 1,
  whiteSpace: 'nowrap',
};

export const RoomConnectionsTable: React.FC<RoomConnectionsTableProps> = ({ roomId }) => {
  const { connections, loading, error } = useStore(connectionStore);
  const [selected, setSelected] = useState<readonly string[]>([]);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [order, setOrder] = useState<Order>('asc');
  const [orderBy, setOrderBy] = useState<ConnectionKeys>('createdAt'); // Default sort by connected at

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [searchTerm, setSearchTerm] = useState('');

  const headCells: HeadCell[] = [
    { id: 'id', numeric: false, disablePadding: true, label: 'ID' },
    { id: 'status', numeric: false, disablePadding: false, label: 'Status' },
    { id: 'clientDataUsername', numeric: false, disablePadding: false, label: 'User/Client' },
    { id: 'role', numeric: false, disablePadding: false, label: 'Role' },
    { id: 'type', numeric: false, disablePadding: false, label: 'Type' },
    { id: 'platform', numeric: false, disablePadding: false, label: 'Platform' },
    { id: 'ip', numeric: false, disablePadding: false, label: 'IP Address' },    { id: 'createdAt', numeric: true, disablePadding: false, label: 'Connected At' },
  ];

  const handleRequestSort = useCallback(
    (event: React.MouseEvent<unknown> | null, property: ConnectionKeys) => {
      const isAsc = orderBy === property && order === 'asc';
      setOrder(isAsc ? 'desc' : 'asc');
      setOrderBy(property);
    },
    [order, orderBy],
  );

  const parseClientData = useCallback((clientDataJson: string): IClientConnectionUserData | null => {
    try {
      const parsed = JSON.parse(clientDataJson);
      return parsed.clientData || parsed; // Handle cases where clientData might be directly the object or nested
    } catch {
      return null;
    }
  }, []);

  // Use useCallback to memoize fetch function for useEffect dependency
  const fetchRoomConnections = useCallback(() => {
    fetchSessionConnections(roomId); // Dispatch action to fetch connections
  }, [roomId]);

  useEffect(() => {
    fetchRoomConnections();
  }, [fetchRoomConnections]); // Depend on memoized fetchRoomConnections

  // Filter connections based on search term
  const filteredConnections = useMemo(() => {
    if (!searchTerm) {
      return connections;
    }
    const lowercasedSearchTerm = searchTerm.toLowerCase();
    return connections.filter((connection) => {
      const clientData = parseClientData(connection.clientData);
      return (
        connection.id.toLowerCase().includes(lowercasedSearchTerm) ||
        connection.status.toLowerCase().includes(lowercasedSearchTerm) ||
        connection.role.toLowerCase().includes(lowercasedSearchTerm) ||
        connection.type.toLowerCase().includes(lowercasedSearchTerm) ||
        connection.platform.toLowerCase().includes(lowercasedSearchTerm) ||
        connection.ip.toLowerCase().includes(lowercasedSearchTerm) ||
        (clientData?.USERNAME && clientData.USERNAME.toLowerCase().includes(lowercasedSearchTerm)) ||
        (clientData?.USERID && clientData.USERID.toString().includes(lowercasedSearchTerm))
      );
    });
  }, [connections, searchTerm, parseClientData]);

  const sortedConnections = useMemo(() => {
    if (!filteredConnections || filteredConnections.length === 0) return [];
    return stableSort(filteredConnections, getComparator(order, orderBy, parseClientData));
  }, [filteredConnections, order, orderBy, parseClientData]);

  const paginatedConnections = useMemo(() => {
    return sortedConnections.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [sortedConnections, page, rowsPerPage]);

  const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const newSelected = filteredConnections.map((n) => n.id);
      setSelected(newSelected);
      return;
    }
    setSelected([]);
  };

  const handleClick = (event: React.MouseEvent<unknown>, id: string) => {
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
  };

  const handleDeleteSelectedConnections = useCallback(async () => {
    if (selected.length === 0) return;

    setIsDeleting(true);
    try {
      const successfulDeletes: string[] = [];
      const failedDeletes: string[] = [];

      await Promise.allSettled(
        selected.map(async (connectionId) => {
          try {
            await deleteConnection(connectionId);
            console.log(`Connection ${connectionId} deleted.`);
            successfulDeletes.push(connectionId);
          } catch (err: any) {
            console.error(`Failed to delete connection ${connectionId}:`, err);
            failedDeletes.push(connectionId);
          }
        }),
      );

      if (successfulDeletes.length > 0) {
        deleteConnectionsFromStore(successfulDeletes, roomId); // Update store
      }

      if (failedDeletes.length > 0 || successfulDeletes.length > 0) {
        await fetchRoomConnections(); // Re-fetch all connections to ensure consistency
      }

      setSelected([]); // Clear selection after deletion attempt
    } catch (err: any) {
      console.error('Error during bulk deletion operation:', err);
    } finally {
      setIsDeleting(false);
    }
  }, [selected, roomId, fetchRoomConnections]);

  const handleChangePage = useCallback((event: unknown, newPage: number) => {
    setPage(newPage);
  }, []);

  const handleChangeRowsPerPage = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0); // Reset to first page when rows per page changes
  }, []);

  const isSelected = (id: string) => selected.indexOf(id) !== -1;
  const numSelected = selected.length;
  const rowCount = filteredConnections.length; // Use filteredConnections for total count

  return (
    <Box className="w-full p-4">
      <Box sx={{bgcolor: 'background.default'}} className="flex flex-col rounded sm:flex-row justify-between items-center mb-4 gap-4 px-2">
        
        <TextField
          label="Search Connections"
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setPage(0); // Reset page on search
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          className="flex-grow max-w-sm w-full sm:w-auto"
        />
        <Toolbar
          sx={{
            pl: { sm: 2 },
            pr: { xs: 1, sm: 1 },
            ...(numSelected > 0 && {
              bgcolor: 'background.default',
            }),
            borderRadius: '4px',
            flexShrink: 0,
            minHeight: '48px', // Ensure consistent height
            justifyContent: 'flex-end', // Align delete button to the right
          }}
          className="w-full sm:w-auto"
        >
          {numSelected > 0 && (
            <Typography
              sx={{ flex: '1 1 auto', mr: 2 }} // Allow text to take space, margin-right for spacing
              color="inherit"
              variant="subtitle1"
              component="div"
            >
              {numSelected} selected
            </Typography>
          )}

          {numSelected > 0 && (
            <Tooltip title="Delete Selected Connections">
              <IconButton color="error" onClick={handleDeleteSelectedConnections} disabled={isDeleting}>
                {isDeleting ? <CircularProgress size={20} color="inherit" /> : <DeleteIcon />}
              </IconButton>
            </Tooltip>
          )}
        </Toolbar>
      </Box>

      {loading && (
        <Box className="flex justify-center items-center p-4">
          <CircularProgress size={40} />
        </Box>
      )}

      {error && (
        <Alert severity="error" className="m-4">
          {error}
        </Alert>
      )}

      {!loading && !error && filteredConnections.length === 0 && ( // Use filteredConnections here
        <Alert severity="info" className="m-4">
          {searchTerm
            ? `No connections found matching "${searchTerm}".`
            : 'No active connections found for this room.'}
        </Alert>
      )}

      {!loading && !error && filteredConnections.length > 0 && ( // Use filteredConnections here
        <TableContainer component={Paper} sx={tableContainerSx}>
          <Table stickyHeader size="small" aria-label="room connections table">
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox" sx={headerCellSx}>
                  <Checkbox
                    color="primary"
                    indeterminate={numSelected > 0 && numSelected < rowCount}
                    checked={rowCount > 0 && numSelected === rowCount}
                    onChange={handleSelectAllClick}
                    inputProps={{ 'aria-label': 'select all connections' }}
                  />
                </TableCell>
                {headCells.map((headCell) => (
                  <TableCell
                    key={headCell.id}
                    align={headCell.numeric ? 'right' : 'left'}
                    padding={headCell.disablePadding ? 'none' : 'normal'}
                    sortDirection={orderBy === headCell.id ? order : false}
                    sx={headerCellSx}
                  >
                    <TableSortLabel
                      active={orderBy === headCell.id}
                      direction={orderBy === headCell.id ? order : 'asc'}
                      onClick={(event) => handleRequestSort(event, headCell.id)}
                    >
                      {headCell.label}
                      {orderBy === headCell.id ? (
                        <Box component="span" sx={{ position: 'absolute', clip: 'rect(0 0 0 0)', width: 1, height: 1, margin: -1, padding: 0, overflow: 'hidden' }}>
                          {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                        </Box>
                      ) : null}
                    </TableSortLabel>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedConnections.map((connection) => {
                const isItemSelected = isSelected(connection.id);
                const labelId = `enhanced-table-checkbox-${connection.id}`;
                const clientData = parseClientData(connection.clientData);
                return (
                  <TableRow
                    hover
                    onClick={(event) => handleClick(event, connection.id)}
                    role="checkbox"
                    aria-checked={isItemSelected}
                    tabIndex={-1}
                    key={connection.id}
                    selected={isItemSelected}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        color="primary"
                        checked={isItemSelected}
                        inputProps={{ 'aria-labelledby': labelId }}
                      />
                    </TableCell>
                    <TableCell component="th" id={labelId} scope="row">
                      <Tooltip title={connection.id} placement="top">
                        <Typography variant="body2" className="font-mono text-xs truncate max-w-[100px] inline-block">
                          {connection.id.substring(0, 8)}...
                        </Typography>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      {connection.status === 'active' ? (
                        <Tooltip title="Active" placement="top">
                          <CheckCircleIcon color="success" fontSize="small" />
                        </Tooltip>
                      ) : (
                        <Tooltip title="Pending / Inactive" placement="top">
                          <AccessTimeFilledIcon color="warning" fontSize="small" />
                        </Tooltip>
                      )}
                    </TableCell>
                    <TableCell>
                      {clientData?.USERNAME ? (
                        <Tooltip title={`User ID: ${clientData.USERID || 'N/A'}`} placement="top">
                          <Typography variant="body2" className="font-semibold">
                            {clientData.USERNAME}
                          </Typography>
                        </Tooltip>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          N/A
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>{connection.role}</TableCell>
                    <TableCell>{connection.type}</TableCell>
                    <TableCell>{connection.platform}</TableCell>
                    <TableCell>{connection.ip}</TableCell>
                    <TableCell>
                      {new Date(connection.createdAt).toLocaleString()}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      {!loading && !error && filteredConnections.length > 0 && (
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={rowCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          className="w-full"
        />
      )}
    </Box>
  );
};
