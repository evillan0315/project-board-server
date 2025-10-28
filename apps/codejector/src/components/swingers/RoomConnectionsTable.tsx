import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useStore } from '@nanostores/react';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Tooltip,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccessTimeFilledIcon from '@mui/icons-material/AccessTimeFilled';
import DeleteIcon from '@mui/icons-material/Delete';
import { IConnection, IClientConnectionUserData } from '@/components/swingers/types';
import { deleteConnection } from '@/components/swingers/api/connections';
import { connectionStore, fetchSessionConnections, deleteConnectionsFromStore } from '@/components/swingers/stores/connectionStore';
import { TableList, ITableColumn, IBulkAction } from '@/components/ui/views/table/TableList';

interface RoomConnectionsTableProps {
  roomId: string;
}

// --- Utility to parse client data (can be moved to a more generic utils if reused elsewhere) ---
const parseClientData = (clientDataJson: string): IClientConnectionUserData | null => {
  try {
    const parsed = JSON.parse(clientDataJson);
    return parsed.clientData || parsed; // Handle cases where clientData might be directly the object or nested
  } catch {
    return null;
  }
};

export const RoomConnectionsTable: React.FC<RoomConnectionsTableProps> = ({ roomId }) => {
  const { connections, loading, error } = useStore(connectionStore);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Use useCallback to memoize fetch function for useEffect dependency
  const fetchRoomConnections = useCallback(() => {
    fetchSessionConnections(roomId); // Dispatch action to fetch connections
  }, [roomId]);

  useEffect(() => {
    fetchRoomConnections();
  }, [fetchRoomConnections]); // Depend on memoized fetchRoomConnections

  const handleDeleteConnections = useCallback(async (actionId: string, selectedIds: string[]) => {
    if (actionId !== 'delete' || selectedIds.length === 0) return;

    setIsDeleting(true);
    try {
      const successfulDeletes: string[] = [];
      // Using Promise.allSettled to allow all deletions to attempt and report results
      await Promise.allSettled(
        selectedIds.map(async (connectionId) => {
          try {
            await deleteConnection(connectionId);
            console.log(`Connection ${connectionId} deleted.`);
            successfulDeletes.push(connectionId);
          } catch (err: any) {
            console.error(`Failed to delete connection ${connectionId}:`, err);
            // Failed deletes are implicitly handled as they won't be in successfulDeletes
          }
        }),
      );

      if (successfulDeletes.length > 0) {
        deleteConnectionsFromStore(successfulDeletes, roomId); // Update store with successful deletions
      }

      // Re-fetch all connections to ensure consistency and update UI, especially if some deletions failed
      await fetchRoomConnections(); 

    } catch (err: any) {
      console.error('Error during bulk deletion operation:', err);
    } finally {
      setIsDeleting(false);
    }
  }, [roomId, fetchRoomConnections]);

  const columns: ITableColumn<IConnection>[] = useMemo(() => [
    { 
      id: 'id', 
      label: 'ID', 
      sortable: true,
      minWidth: '120px',
      render: (row) => (
        <Tooltip title={row.id} placement="top">
          <Typography variant="body2" className="font-mono text-xs truncate max-w-[100px] inline-block">
            {row.id.substring(0, 8)}...
          </Typography>
        </Tooltip>
      )
    },
    { 
      id: 'status', 
      label: 'Status', 
      sortable: true, 
      align: 'center', 
      minWidth: '80px',
      render: (row) => (
        row.status === 'active' ? (
          <Tooltip title="Active" placement="top">
            <CheckCircleIcon color="success" fontSize="small" />
          </Tooltip>
        ) : (
          <Tooltip title="Pending / Inactive" placement="top">
            <AccessTimeFilledIcon color="warning" fontSize="small" />
          </Tooltip>
        )
      )
    },
    { 
      id: 'clientDataUsername', 
      label: 'User/Client', 
      sortable: true,
      sortAccessor: (row) => parseClientData(row.clientData)?.USERNAME || '',
      minWidth: '150px',
      render: (row) => {
        const clientData = parseClientData(row.clientData);
        return clientData?.USERNAME ? (
          <Tooltip title={`User ID: ${clientData.USERID || 'N/A'}`} placement="top">
            <Typography variant="body2" className="font-semibold">
              {clientData.USERNAME}
            </Typography>
          </Tooltip>
        ) : (
          <Typography variant="body2" color="text.secondary">
            N/A
          </Typography>
        );
      }
    },
    { id: 'role', label: 'Role', sortable: true, render: (row) => row.role, minWidth: '100px' },
    { id: 'type', label: 'Type', sortable: true, render: (row) => row.type, minWidth: '100px' },
    { id: 'platform', label: 'Platform', sortable: true, render: (row) => row.platform, minWidth: '100px' },
    { id: 'ip', label: 'IP Address', sortable: true, render: (row) => row.ip, minWidth: '120px' },
    { 
      id: 'createdAt', 
      label: 'Connected At', 
      numeric: true, 
      sortable: true, 
      minWidth: '180px',
      render: (row) => new Date(row.createdAt).toLocaleString()
    },
  ], []);

  const bulkActions: IBulkAction[] = useMemo(() => [
    {
      id: 'delete',
      label: 'Delete Selected Connections',
      icon: isDeleting ? <CircularProgress size={20} color="inherit" /> : <DeleteIcon />,
      color: 'error',
      disabled: isDeleting,
    },
  ], [isDeleting]);

  return (
    <TableList
      title="Room Connections"
      data={connections}
      columns={columns}
      isLoading={loading}
      error={error}
      keyField="id"
      onRowSelect={() => {}} // Enable row selection by providing a no-op function
      onBulkAction={handleDeleteConnections}
      bulkActions={bulkActions}
      searchableKeys={['id', 'status', 'role', 'type', 'platform', 'ip', 'clientDataUsername', 'clientDataUserId']}
      searchFilter={(item, searchTerm, searchableKeys) => {
        const lowercasedSearchTerm = searchTerm.toLowerCase();
        return searchableKeys.some(key => {
          let value: any;
          if (key === 'clientDataUsername') {
            value = parseClientData(item.clientData)?.USERNAME || '';
          } else if (key === 'clientDataUserId') {
            value = parseClientData(item.clientData)?.USERID || '';
          } else {
            value = (item as any)[key as keyof IConnection];
          }
          return String(value).toLowerCase().includes(lowercasedSearchTerm);
        });
      }}
      tableContainerSx={{ maxHeight: '400px' }}
      emptyMessage="No active connections found for this room."
      noSearchResultsMessage="No connections found matching your search term."
    />
  );
};
