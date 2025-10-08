import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@nanostores/react';
import {
  organizationStore,
  setLoading,
  setError,
  setOrganizations,
  addOrganization,
  updateOrganizationInStore,
  deleteOrganizationFromStore,
  setCurrentOrganization,
} from '@/stores/organizationStore';
import { authStore } from '@/stores/authStore';
import {
  createOrganization,
  getOrganizations,
  updateOrganization,
  deleteOrganization,
} from '@/api/organization';
import {
  Organization,
  CreateOrganizationDto,
  UpdateOrganizationDto,
} from '@/types';

import {
  Box,
  Typography,
  Container,
  Paper,
  useTheme,
  Button,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CorporateFareIcon from '@mui/icons-material/CorporateFare';

// Interfaces for dialog forms
interface OrganizationFormDialogProps {
  open: boolean;
  onClose: () => void;
  onCreate?: (dto: CreateOrganizationDto) => Promise<void>;
  onUpdate?: (id: string, dto: UpdateOrganizationDto) => Promise<void>;
  initialData?: Organization | null;
  isEditMode: boolean;
  loading: boolean;
}

const OrganizationFormDialog: React.FC<OrganizationFormDialogProps> = ({
  open,
  onClose,
  onCreate, // New prop
  onUpdate, // New prop
  initialData,
  isEditMode,
  loading,
}) => {
  const theme = useTheme();
  const [name, setName] = useState(initialData?.name || '');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    setName(initialData?.name || '');
    setFormError(null);
  }, [initialData, open]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setFormError('Organization name cannot be empty.');
      return;
    }
    setFormError(null);

    const dto = { name }; // DTO prepared by the dialog (name is always string from state)

    try {
      if (isEditMode) {
        if (onUpdate && initialData?.id) {
          await onUpdate(initialData.id, dto);
        }
      } else {
        if (onCreate) {
          await onCreate(dto);
        }
      }
      onClose(); // Close dialog on successful submission
    } catch (error) {
      // Error handling will be done by the parent (onUpdate/onCreate functions)
      // But we can catch and set a local form error if needed
      setFormError(
        `Submission failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          bgcolor: theme.palette.background.paper,
          color: theme.palette.text.primary,
        },
      }}
    >
      <DialogTitle sx={{ color: theme.palette.text.primary }}>
        {isEditMode ? 'Edit Organization' : 'Create Organization'}
      </DialogTitle>
      <DialogContent>
        {formError && <Alert severity="error">{formError}</Alert>}
        <TextField
          autoFocus
          margin="dense"
          id="name"
          label="Organization Name"
          type="text"
          fullWidth
          variant="outlined"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={loading}
          sx={{ mt: 2 }}
          InputLabelProps={{ shrink: true }}
          InputProps={{ style: { color: theme.palette.text.primary } }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          color="primary"
          variant="contained"
          disabled={loading || !name.trim()}
          startIcon={loading && <CircularProgress size={20} />}
        >
          {isEditMode ? 'Update' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const OrganizationPage: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { isLoggedIn } = useStore(authStore);
  const { organizations, loading, error } = useStore(organizationStore);

  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentOrganizationToEdit, setCurrentOrganizationToEdit] =
    useState<Organization | null>(null);

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    fetchOrganizations();
  }, [isLoggedIn, navigate]);

  const fetchOrganizations = async () => {
    setLoading(true);
    setError(null);
    try {
      const orgs = await getOrganizations();
      setOrganizations(orgs);
    } catch (err) {
      setError(
        `Failed to fetch organizations: ${err instanceof Error ? err.message : String(err)}`,
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNewOrganization = async (dto: CreateOrganizationDto) => {
    setLoading(true);
    setError(null);
    try {
      const newOrg = await createOrganization(dto);
      addOrganization(newOrg);
      // After creating, automatically navigate to its projects or refetch to update list
      fetchOrganizations(); // Re-fetch to ensure list is accurate
    } catch (err) {
      setError(
        `Failed to create organization: ${err instanceof Error ? err.message : String(err)}`,
      );
      throw err; // Re-throw to allow dialog to catch if needed
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOrganization = async (
    id: string,
    dto: UpdateOrganizationDto,
  ) => {
    setLoading(true);
    setError(null);
    try {
      const updatedOrg = await updateOrganization(id, dto);
      updateOrganizationInStore(updatedOrg);
    } catch (err) {
      setError(
        `Failed to update organization: ${err instanceof Error ? err.message : String(err)}`,
      );
      throw err; // Re-throw to allow dialog to catch if needed
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOrganization = async (id: string) => {
    if (
      window.confirm(
        'Are you sure you want to delete this organization? This action cannot be undone.',
      )
    ) {
      setLoading(true);
      setError(null);
      try {
        await deleteOrganization(id);
        deleteOrganizationFromStore(id);
        fetchOrganizations(); // Re-fetch to ensure list is accurate
      } catch (err) {
        setError(
          `Failed to delete organization with ID ${id}: ${err instanceof Error ? err.message : String(err)}`,
        );
      } finally {
        setLoading(false);
      }
    }
  };

  const handleOpenCreateDialog = () => {
    setIsEditMode(false);
    setCurrentOrganizationToEdit(null);
    setIsFormDialogOpen(true);
  };

  const handleOpenEditDialog = (org: Organization) => {
    setIsEditMode(true);
    setCurrentOrganizationToEdit(org);
    setIsFormDialogOpen(true);
  };

  const handleViewProjects = (org: Organization) => {
    setCurrentOrganization(org); // Set current organization in store
    navigate(`/organizations/${org.id}/projects`);
  };

  if (!isLoggedIn) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <Alert severity="warning">Please log in to manage organizations.</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4, flexGrow: 1 }}>
      <Paper
        elevation={3}
        sx={{
          p: 4,
          borderRadius: 2,
          bgcolor: theme.palette.background.paper,
          color: theme.palette.text.primary,
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
          minHeight: 'calc(100vh - 120px)',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Typography
            variant="h4"
            component="h1"
            sx={{
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <CorporateFareIcon sx={{ fontSize: 40 }} /> Organizations
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleOpenCreateDialog}
            disabled={loading}
          >
            Create New Organization
          </Button>
        </Box>

        <Typography variant="body1" color="text.secondary">
          Manage your organizations and the projects associated with them.
        </Typography>

        {error && <Alert severity="error">{error}</Alert>}

        {loading ? (
          <Box className="flex justify-center items-center flex-grow">
            <CircularProgress size={40} />
            <Typography
              variant="h6"
              sx={{ ml: 2, color: theme.palette.text.secondary }}
            >
              Loading organizations...
            </Typography>
          </Box>
        ) : organizations.length === 0 ? (
          <Alert severity="info">
            No organizations found. Click 'Create New Organization' to get
            started.
          </Alert>
        ) : (
          <TableContainer
            component={Paper}
            sx={{ border: `1px solid ${theme.palette.divider}` }}
          >
            <Table>
              <TableHead sx={{ bgcolor: theme.palette.action.hover }}>
                <TableRow>
                  <TableCell
                    sx={{
                      fontWeight: 'bold',
                      color: theme.palette.text.primary,
                    }}
                  >
                    Name
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 'bold',
                      color: theme.palette.text.primary,
                    }}
                  >
                    Created At
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{
                      fontWeight: 'bold',
                      color: theme.palette.text.primary,
                    }}
                  >
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {organizations.map((org) => (
                  <TableRow key={org.id} hover>
                    <TableCell sx={{ color: theme.palette.text.primary }}>
                      {org.name}
                    </TableCell>
                    <TableCell sx={{ color: theme.palette.text.secondary }}>
                      {new Date(org.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="View Projects">
                        <IconButton
                          color="primary"
                          onClick={() => handleViewProjects(org)}
                          disabled={loading}
                        >
                          <VisibilityIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit Organization">
                        <IconButton
                          color="info"
                          onClick={() => handleOpenEditDialog(org)}
                          disabled={loading}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Organization">
                        <IconButton
                          color="error"
                          onClick={() => handleDeleteOrganization(org.id)}
                          disabled={loading}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <OrganizationFormDialog
        open={isFormDialogOpen}
        onClose={() => setIsFormDialogOpen(false)}
        onCreate={!isEditMode ? handleCreateNewOrganization : undefined}
        onUpdate={isEditMode ? handleUpdateOrganization : undefined}
        initialData={currentOrganizationToEdit}
        isEditMode={isEditMode}
        loading={loading}
      />
    </Container>
  );
};

export default OrganizationPage;
