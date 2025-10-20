// src/components/recording/RecordingsPagination.tsx
import { TablePagination } from '@mui/material';
import { useStore } from '@nanostores/react';
import {
  recordingsPageStore,
  recordingsRowsPerPageStore,
  totalRecordingsStore,
  setRecordingsPage,
  setRecordingsRowsPerPage,
} from './stores/recordingStore';

export interface RecordingsPaginationProps {
  rowsPerPageOptions?: number[];
}

export function RecordingsPagination({
  rowsPerPageOptions = [5, 10, 25],
}: RecordingsPaginationProps) {
  const total = useStore(totalRecordingsStore);
  const page = useStore(recordingsPageStore);
  const rowsPerPage = useStore(recordingsRowsPerPageStore);

  const handlePageChange = (_: unknown, newPage: number) =>
    setRecordingsPage(newPage);
  const handleRowsPerPageChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setRecordingsRowsPerPage(parseInt(event.target.value, 10));
    setRecordingsPage(0);
  };

  return (
    <TablePagination
      component="div"
      count={total}
      page={page}
      rowsPerPage={rowsPerPage}
      onPageChange={handlePageChange}
      onRowsPerPageChange={handleRowsPerPageChange}
      rowsPerPageOptions={rowsPerPageOptions}
    />
  );
}
