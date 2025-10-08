import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Avatar,
  IconButton,
} from '@mui/material';
import { Add as AddIcon, Close as CloseIcon } from '@mui/icons-material';

interface Task {
  id: number;
  title: string;
  description: string;
  status: string;
  labels: string[];
  assignee: { id: number; name: string; color: string };
  dueDate: string;
}

interface Column {
  id: string;
  title: string;
}

interface KanbanBoardProps {
  initialTasks?: Task[];
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ initialTasks = [] }) => {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [open, setOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);

  const columns: Column[] = [
    { id: 'todo', title: 'To Do' },
    { id: 'inprogress', title: 'In Progress' },
    { id: 'review', title: 'Review' },
    { id: 'done', title: 'Done' },
  ];

  const handleOpen = (task: Task | null = null) => {
    setCurrentTask(task);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setCurrentTask(null);
  };

  const handleSave = (taskData: Task) => {
    if (taskData.id) {
      // Update existing task
      setTasks(
        tasks.map((task) => (task.id === taskData.id ? taskData : task)),
      );
    } else {
      // Create new task
      const newTask = {
        ...taskData,
        id: Math.max(...tasks.map((t) => t.id), 0) + 1,
      };
      setTasks([...tasks, newTask]);
    }
    handleClose();
  };

  const handleDelete = (taskId: number) => {
    setTasks(tasks.filter((task) => task.id !== taskId));
    handleClose();
  };

  const handleDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    taskId: number,
  ) => {
    e.dataTransfer.setData('taskId', taskId.toString());
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, status: string) => {
    e.preventDefault();
    const taskId = parseInt(e.dataTransfer.getData('taskId'));

    setTasks(
      tasks.map((task) => (task.id === taskId ? { ...task, status } : task)),
    );
  };

  return (
    <Grid container spacing={3}>
      {columns.map((column) => (
        <Grid
          item
          xs={12}
          sm={6}
          md={4}
          lg={3}
          key={column.id}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, column.id)}
        >
          <Paper
            elevation={3}
            sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}
          >
            <Box
              sx={{
                p: 2,
                borderBottom: '1px solid #ddd',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Typography variant="h6" component="h2">
                {column.title}
              </Typography>
              <Chip
                label={tasks.filter((task) => task.status === column.id).length}
                size="small"
                color="primary"
              />
            </Box>
            <Box sx={{ p: 2, flexGrow: 1, overflowY: 'auto' }}>
              {tasks
                .filter((task) => task.status === column.id)
                .map((task) => (
                  <Card
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    onClick={() => handleOpen(task)}
                    sx={{ mb: 1.5, cursor: 'pointer' }}
                  >
                    <CardContent>
                      <Typography variant="subtitle1" component="div">
                        {task.title}
                      </Typography>
                      <Box
                        sx={{
                          mt: 1,
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: 0.5,
                        }}
                      >
                        {task.labels.map((label) => (
                          <Chip key={label} label={label} size="small" />
                        ))}
                      </Box>
                      <Box
                        sx={{
                          mt: 2,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <Typography variant="caption" color="textSecondary">
                          {task.dueDate}
                        </Typography>
                        <Avatar
                          sx={{
                            width: 24,
                            height: 24,
                            bgcolor: task.assignee.color,
                            fontSize: '0.75rem',
                          }}
                        >
                          {task.assignee.name}
                        </Avatar>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              {tasks.filter((task) => task.status === column.id).length ===
                0 && (
                <Typography variant="body2" color="textSecondary">
                  No tasks in this column
                </Typography>
              )}
            </Box>
            <Button
              startIcon={<AddIcon />}
              onClick={() => handleOpen({ status: column.id } as Task)}
              sx={{ p: 2, borderTop: '1px solid #ddd', borderRadius: 0 }}
            >
              Add task
            </Button>
          </Paper>
        </Grid>
      ))}
      {open && (
        <TaskModal
          task={currentTask}
          onSave={handleSave}
          onDelete={handleDelete}
          onClose={handleClose}
        />
      )}
    </Grid>
  );
};

interface TaskModalProps {
  task: Task | null;
  onSave: (taskData: Task) => void;
  onDelete: (taskId: number) => void;
  onClose: () => void;
}

const TaskModal: React.FC<TaskModalProps> = ({
  task,
  onSave,
  onDelete,
  onClose,
}) => {
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [status, setStatus] = useState(task?.status || 'todo');
  const [labels, setLabels] = useState(task?.labels?.join(', ') || '');
  const [dueDate, setDueDate] = useState(task?.dueDate || '');
  const [assignee, setAssignee] = useState<number | ''>(
    task?.assignee?.id || '',
  );

  const assignees = [
    { id: 1, name: 'John Smith', initials: 'JS', color: '#f44336' },
    { id: 2, name: 'Alice Lee', initials: 'AL', color: '#2196f3' },
    { id: 3, name: 'Mike Johnson', initials: 'MJ', color: '#4caf50' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    onSave({
      id: task?.id as number,
      title,
      description,
      status,
      labels: labels
        .split(',')
        .map((l) => l.trim())
        .filter((l) => l),
      dueDate,
      assignee: assignees.find((a) => a.id === assignee) || assignees[0],
    });
  };

  return (
    <Dialog open={true} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>
        {task?.id ? 'Edit Task' : 'Create New Task'}
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="title"
            label="Title"
            name="title"
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <TextField
            margin="normal"
            fullWidth
            id="description"
            label="Description"
            name="description"
            multiline
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <FormControl fullWidth margin="normal">
            <InputLabel id="status-label">Status</InputLabel>
            <Select
              labelId="status-label"
              id="status"
              value={status}
              label="Status"
              onChange={(e) => setStatus(e.target.value)}
            >
              <MenuItem value="todo">To Do</MenuItem>
              <MenuItem value="inprogress">In Progress</MenuItem>
              <MenuItem value="review">Review</MenuItem>
              <MenuItem value="done">Done</MenuItem>
            </Select>
          </FormControl>
          <TextField
            margin="normal"
            fullWidth
            id="labels"
            label="Labels (comma separated)"
            name="labels"
            value={labels}
            onChange={(e) => setLabels(e.target.value)}
          />
          <TextField
            margin="normal"
            fullWidth
            id="dueDate"
            label="Due Date"
            type="date"
            name="dueDate"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            InputLabelProps={{
              shrink: true,
            }}
          />
          <FormControl fullWidth margin="normal">
            <InputLabel id="assignee-label">Assignee</InputLabel>
            <Select
              labelId="assignee-label"
              id="assignee"
              value={assignee}
              label="Assignee"
              onChange={(e) => setAssignee(e.target.value as any)}
            >
              {assignees.map((a) => (
                <MenuItem key={a.id} value={a.id}>
                  {a.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </DialogContent>
      <DialogActions>
        {task?.id && (
          <Button onClick={() => onDelete(task.id)} color="secondary">
            Delete
          </Button>
        )}
        <Button onClick={onClose} color="primary">
          Cancel
        </Button>
        <Button type="submit" onClick={handleSubmit} color="primary">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default KanbanBoard;
