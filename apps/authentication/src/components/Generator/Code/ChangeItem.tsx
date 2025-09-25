import React from 'react';
import {
  Box,
  Checkbox,
  Typography,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  ListItem,
  ListItemText
} from '@mui/material';
import { type SvgIconProps } from '@mui/material/SvgIcon';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import EditIcon from '@mui/icons-material/Edit';
import BuildCircleIcon from '@mui/icons-material/BuildCircle';
import InsightsIcon from '@mui/icons-material/Insights';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CodeMirror from '@uiw/react-codemirror';
import { oneDark } from '@codemirror/theme-one-dark';
import { javascript } from '@codemirror/lang-javascript';

import { FileAction } from '@/constants/types';

export interface ChangeEntry {
  id: number;
  filePath: string;
  action: FileAction;
  reason: string;
  newContent: string;
}

interface ChangeItemProps {
  index: number;
  change: ChangeEntry;
  selected: boolean;
  onToggle: () => void;
}

const actionColor: Record<ChangeEntry['action'], 'success' | 'primary' | 'warning' | 'info' | 'error'> = {
  add: 'success',
  modify: 'primary',
  repair: 'warning',
  analyze: 'info',
  delete: 'error',
};

const actionIcon: Record<ChangeEntry['action'], React.ComponentType<SvgIconProps>> = {
  add: AddCircleOutlineIcon,
  modify: EditIcon,
  repair: BuildCircleIcon,
  analyze: InsightsIcon,
  delete: DeleteOutlineIcon,
};

export const ChangeItem: React.FC<ChangeItemProps> = ({ index, change, selected, onToggle }) => {
  const IconComponent = actionIcon[change.action];

  return (
    <ListItem
      key={change.filePath}
      alignItems="flex-start"
      sx={{ flexDirection: 'column', mb: 2 }}
    >
      <Box display="flex" alignItems="center" width="100%" gap={1}>
        <Checkbox checked={selected} onChange={onToggle} />
        <IconComponent color={actionColor[change.action]} />
        <Typography variant="subtitle1" fontWeight="bold">
          {index + 1}. {change.filePath}
        </Typography>
        <Chip
          label={change.action.toUpperCase()}
          color={actionColor[change.action]}
          size="small"
        />
      </Box>

      {change.newContent && (
        <Accordion sx={{ width: '100%', mt: 1 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="body2" fontWeight="medium">
              View Code
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <CodeMirror
              value={change.newContent}
              //minHeight="200px"
              maxHeight="300px"
              theme={oneDark}
              extensions={[javascript()]}
              editable={false}
              basicSetup={{
                lineNumbers: true,
                highlightActiveLine: true,
              }}
            />
          </AccordionDetails>
        </Accordion>
      )}

      <ListItemText
        secondary={
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {change.reason}
          </Typography>
        }
      />
    </ListItem>
  );
};

