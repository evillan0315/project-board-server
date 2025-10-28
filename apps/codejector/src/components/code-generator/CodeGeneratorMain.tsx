import React from 'react';
import { AppDefinition } from '@/types';
import { appDefinitions } from '@/constants/appDefinitions';
import {
  Card,
  CardContent,
  Typography,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box,
  Grid,
  CardActionArea,
  Tooltip,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

// Section icons
import PsychologyIcon from '@mui/icons-material/Psychology';
import ChangeCircleIcon from '@mui/icons-material/ChangeCircle';
import GitHubIcon from '@mui/icons-material/GitHub';
import DescriptionIcon from '@mui/icons-material/Description';
import { useNavigate } from 'react-router-dom';

import { ThoughtProcess } from './ThoughtProcess';
import { ChangesList } from './ChangesList';
import { GitInstructions } from './GitInstructions';
import { DocumentationViewer } from './DocumentationViewer';
import { FileChange } from '@/types/llm';

export interface CodeGeneratorData {
  title: string;
  summary: string;
  thoughtProcess: string;
  documentation: string;
  gitInstructions: string[];
  changes: FileChange[];
}

interface Props {
  /** Data payload for the entire code-generator page */
  data: CodeGeneratorData | null;
}

const AIToolsView: React.FC = () => {
  const aiTools = appDefinitions.filter((app) => app.category === 'AI Tools');
  const navigate = useNavigate();

  return (
    <Grid container spacing={3} justifyContent="center" alignItems="stretch"> {/* Added alignItems="stretch" */}
      {aiTools.map((tool: AppDefinition) => (
        <Grid item key={tool.id} xs={12} sm={6} md={6} lg={6}>
          <CardActionArea onClick={() => navigate(tool.link)} sx={{ height: '100%' }}> {/* Ensure CardActionArea takes full height */}
            <Card
              variant="outlined"
              sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Box display="flex" alignItems="center" gap={1}>
                  <tool.icon color="primary" />
                  <Tooltip title={tool.description} arrow>
                    <Typography variant="h6" component="div" className='truncate'>
                      {tool.title}
                    </Typography>
                  </Tooltip>
                </Box>
                <Typography color="text.secondary">
                  {tool.description}
                </Typography>
              </CardContent>
            </Card>
          </CardActionArea>
        </Grid>
      ))}
    </Grid>
  );
};

/**
 * Main container component for the code-generator view.
 * Renders the summary, thought process, proposed changes,
 * git instructions and documentation in collapsible sections.
 */
export const CodeGeneratorMain: React.FC<Props> = ({ data }) => {
  if (!data) {
    return (
      <Box className="flex flex-col items-center justify-center h-full">
        <Typography variant="h5" gutterBottom>
          Explore Our AI Tools
        </Typography>
        <AIToolsView />
      </Box>
    );
  }
  return (
    <Box className="overflow-auto h-full">
      <Card variant="outlined">
        <CardContent>
          {/* Title and Summary */}
          <Typography variant="h6" gutterBottom>
            {data.title}
          </Typography>

          <Typography variant="body1" color="text.secondary" paragraph>
            {data.summary}
          </Typography>

          <Divider sx={{ my: 2 }} />

          {/* Collapsible Sections with Icons */}
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box display="flex" alignItems="center" gap={1}>
                <PsychologyIcon color="primary" />
                <Typography variant="body1">Thought Process</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <ThoughtProcess text={data.thoughtProcess} />
            </AccordionDetails>
          </Accordion>

          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box display="flex" alignItems="center" gap={1}>
                <ChangeCircleIcon color="secondary" />
                <Typography variant="body1">Proposed Changes</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <ChangesList changes={data.changes} />
            </AccordionDetails>
          </Accordion>
          {data.gitInstructions?.length > 0 && (
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box display="flex" alignItems="center" gap={1}>
                  <GitHubIcon color="action" />
                  <Typography variant="body1">Git Instructions</Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <GitInstructions instructions={data.gitInstructions} />
              </AccordionDetails>
            </Accordion>
          )}

          {data.documentation && (
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box display="flex" alignItems="center" gap={1}>
                  <DescriptionIcon color="info" />
                  <Typography variant="body1">Documentation</Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <DocumentationViewer documentation={data.documentation} />
              </AccordionDetails>
            </Accordion>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};
