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
    <Paper
      elevation={2}
      className="p-6 mt-6 bg-blue-50/50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-700 transition-colors duration-300"
    >
      <Typography
        variant="h5"
        className="!font-bold !text-blue-800 dark:!text-blue-200 mb-4 transition-colors duration-300"
      >
        Resume Optimization Results
      </Typography>

      <Box className="mb-4 p-4 bg-blue-100 dark:bg-blue-900 rounded-md shadow-inner flex flex-col sm:flex-row items-center justify-between transition-colors duration-300">
        <Typography
          variant="h6"
          className="!font-semibold !text-blue-900 dark:!text-blue-100 transition-colors duration-300"
        >
          Optimization Score:
        </Typography>
        <Typography
          variant="h4"
          className="!font-extrabold !text-blue-700 dark:!text-blue-300 transition-colors duration-300"
        >
          {result.optimizationScore}%
        </Typography>
      </Box>

      <Typography
        variant="h6"
        className="!font-semibold !text-gray-800 dark:!text-gray-200 mt-4 transition-colors duration-300"
      >
        Tailored Summary:
      </Typography>
      <Typography
        variant="body1"
        className="text-gray-700 dark:text-gray-300 mb-4 whitespace-pre-wrap transition-colors duration-300"
      >
        {result.tailoredSummary}
      </Typography>

      {result.suggestions && result.suggestions.length > 0 && (
        <>
          <Typography
            variant="h6"
            className="!font-semibold !text-gray-800 dark:!text-gray-200 mt-4 transition-colors duration-300"
          >
            Detailed Suggestions:
          </Typography>
          <List className="w-full">
            {result.suggestions.map((suggestion, index) => (
              <React.Fragment key={index}>
                <ListItem className="flex-col items-start px-0">
                  <ListItemText
                    primary={
                      <Typography
                        variant="subtitle1"
                        className="!font-medium !text-purple-700 dark:!text-purple-300 transition-colors duration-300"
                      >
                        {suggestion.type}: {suggestion.recommendation}
                      </Typography>
                    }
                    secondary={
                      suggestion.details &&
                      suggestion.details.length > 0 && (
                        <ul className="list-disc list-inside mt-2 text-gray-600 dark:text-gray-400 transition-colors duration-300">
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
        <Box className="mt-6 p-4 bg-gray-100 dark:bg-gray-900 rounded-md border border-gray-300 dark:border-gray-600 transition-colors duration-300">
          <Typography
            variant="h6"
            className="!font-semibold !text-gray-800 dark:!text-gray-200 mb-2 transition-colors duration-300"
          >
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
