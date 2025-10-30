import React from 'react';
import { Box, Typography } from '@mui/material';
import { IFileChange } from '@/types/planner';
import clsx from 'clsx';

interface FileChangeCardProps {
  change: IFileChange;
}

export const FileChangeCard: React.FC<FileChangeCardProps> = ({ change }) => {
  const fileExtension = change.filePath.split('.').pop();
  const isCode = ['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'json', 'css', 'html', 'md', 'xml', 'yaml'].includes(fileExtension || '');

  const getCodeContent = (content: string) => (
    <pre className='bg-gray-100 dark:bg-gray-800 p-3 rounded-md overflow-auto text-sm font-mono'>
      <code>{content}</code>
    </pre>
  );

  return (
    <Box className='space-y-3'>
      <Typography variant='body2' sx={{ fontWeight: 'bold' }}>
        File: <span className='font-mono'>{change.filePath}</span>
      </Typography>
      <Typography variant='body2' sx={{ fontWeight: 'bold' }}>
        Action: 
        <span
          className={clsx('font-mono px-2 py-1 rounded-full text-xs font-semibold ml-2',
            change.action === 'ADD' && 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
            change.action === 'MODIFY' && 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
            change.action === 'DELETE' && 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
            change.action === 'REPAIR' && 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
            change.action === 'ANALYZE' && 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
          )}
        >
          {change.action}
        </span>
      </Typography>

      {change.reason && (
        <Typography variant='body2'>
          <span className='font-semibold'>Reason:</span> {change.reason}
        </Typography>
      )}

      {change.newContent && (
        <Box>
          <Typography variant='body2' sx={{ fontWeight: 'bold', mb: 1 }}>
            New Content:
          </Typography>
          {isCode ? getCodeContent(change.newContent) : (
            <pre className='bg-gray-100 dark:bg-gray-800 p-3 rounded-md overflow-auto text-sm'>
              {change.newContent}
            </pre>
          )}
        </Box>
      )}

      {change.diff && (
        <Box>
          <Typography variant='body2' sx={{ fontWeight: 'bold', mb: 1 }}>
            Unified Diff:
          </Typography>
          {getCodeContent(change.diff)}
        </Box>
      )}
    </Box>
  );
};
