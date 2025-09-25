import React from 'react';
import {
  Container,
  Card,
  CardContent,
  Typography,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

// Section icons
import PsychologyIcon from '@mui/icons-material/Psychology';
import ChangeCircleIcon from '@mui/icons-material/ChangeCircle';
import GitHubIcon from '@mui/icons-material/GitHub';
import DescriptionIcon from '@mui/icons-material/Description';

import { ThoughtProcess } from './ThoughtProcess';
import { ChangesList } from './ChangesList';
import { GitInstructions } from './GitInstructions';
import { DocumentationViewer } from './DocumentationViewer';
import { type ChangeEntry } from './ChangeItem';

export interface CodeGeneratorData {
  title: string;
  summary: string;
  thoughtProcess: string;
  documentation: string;
  gitInstructions: string[];  // ← change from string to string[]
  changes: ChangeEntry[];
}

interface Props {
  /** Data payload for the entire code-generator page */
  data: CodeGeneratorData;
}

/**
 * Main container component for the code-generator view.
 * Renders the summary, thought process, proposed changes,
 * git instructions and documentation in collapsible sections.
 */
export const CodeGenerator: React.FC<Props> = ({ data }) => {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Card variant="outlined">
        <CardContent>
          {/* Title and Summary */}
          <Typography variant="h4" gutterBottom>
            {data.title}
          </Typography>

          <Typography variant="subtitle1" color="text.secondary" paragraph>
            {data.summary}
          </Typography>

          <Divider sx={{ my: 2 }} />

          {/* Collapsible Sections with Icons */}
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box display="flex" alignItems="center" gap={1}>
                <PsychologyIcon color="primary" />
                <Typography variant="h6">Thought Process</Typography>
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
                <Typography variant="h6">Proposed Changes</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <ChangesList changes={data.changes} />
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box display="flex" alignItems="center" gap={1}>
                <GitHubIcon color="action" />
                <Typography variant="h6">Git Instructions</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <GitInstructions instructions={data.gitInstructions} />
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box display="flex" alignItems="center" gap={1}>
                <DescriptionIcon color="info" />
                <Typography variant="h6">Documentation</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <DocumentationViewer documentation={data.documentation} />
            </AccordionDetails>
          </Accordion>
        </CardContent>
      </Card>
    </Container>
  );
};

