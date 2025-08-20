import React from 'react';
import { OptimizationResult } from '@/types/resume';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';

interface OptimizationDisplaySectionProps {
  result: OptimizationResult;
}

const OptimizationDisplaySection: React.FC<OptimizationDisplaySectionProps> = ({ result }) => {
  return (
    <Paper elevation={2} className="p-6 mt-6 bg-blue-50/50 border border-blue-200">
      <Typography variant="h5" className="!font-bold !text-blue-800 mb-4">
        Resume Optimization Results
      </Typography>

      <Box className="mb-4 p-4 bg-blue-100 rounded-md shadow-inner flex flex-col sm:flex-row items-center justify-between">
        <Typography variant="h6" className="!font-semibold !text-blue-900">
          Optimization Score:
        </Typography>
        <Typography variant="h4" className="!font-extrabold !text-blue-700">
          {result.optimizationScore}%
        </Typography>
      </Box>

      <Typography variant="h6" className="!font-semibold !text-gray-800 mt-4">
        Tailored Summary:
      </Typography>
      <Typography variant="body1" className="text-gray-700 mb-4 whitespace-pre-wrap">
        {result.tailoredSummary}
      </Typography>

      {result.suggestions && result.suggestions.length > 0 && (
        <>
          <Typography variant="h6" className="!font-semibold !text-gray-800 mt-4">
            Detailed Suggestions:
          </Typography>
          <List className="w-full">
            {result.suggestions.map((suggestion, index) => (
              <React.Fragment key={index}>
                <ListItem className="flex-col items-start px-0">
                  <ListItemText
                    primary={
                      <Typography variant="subtitle1" className="!font-medium !text-purple-700">
                        {suggestion.type}: {suggestion.recommendation}
                      </Typography>
                    }
                    secondary={
                      suggestion.details &&
                      suggestion.details.length > 0 && (
                        <ul className="list-disc list-inside mt-2 text-gray-600">
                          {suggestion.details.map((detail, detailIndex) => (
                            <li key={detailIndex}>{detail}</li>
                          ))}
                        </ul>
                      )
                    }
                  />
                </ListItem>
                {index < result.suggestions.length - 1 && (
                  <Divider component="li" className="!my-2" />
                )}
              </React.Fragment>
            ))}
          </List>
        </>
      )}

      {result.improvedResumeSection && (
        <Box className="mt-6 p-4 bg-gray-100 rounded-md border border-gray-300">
          <Typography variant="h6" className="!font-semibold !text-gray-800 mb-2">
            Example Improved Section:
          </Typography>
          <pre className="bg-gray-800 text-green-400 p-4 rounded-md overflow-auto text-sm font-mono">
            {result.improvedResumeSection}
          </pre>
        </Box>
      )}
    </Paper>
  );
};

export default OptimizationDisplaySection;
