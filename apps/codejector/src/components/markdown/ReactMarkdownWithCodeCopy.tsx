import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import rehypeHighlight from 'rehype-highlight';
import { Box, IconButton, Tooltip, Typography, useTheme, SxProps } from '@mui/material';
import FileCopyIcon from '@mui/icons-material/FileCopy';

interface ReactMarkdownWithCodeCopyProps {
  children: string;
}

// Define consistent sx styles at the top for maintainability
const getCodeBlockContainerSx = (theme: ReturnType<typeof useTheme>): SxProps => ({
  position: 'relative',
  marginY: theme.spacing(2),
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.codeBlockBackground,
  border: `1px solid ${theme.palette.divider}`,
  overflowX: 'auto',
  whiteSpace: 'pre'
});

const getInlineCodeSx = (theme: ReturnType<typeof useTheme>): SxProps => ({
  backgroundColor: theme.palette.inlineCodeBackground,
  borderRadius: theme.shape.borderRadius / 2, // Equivalent to rounded-sm
  paddingX: theme.spacing(0.5),
  paddingY: theme.spacing(0.25),
  fontFamily: 'monospace',
  fontSize: theme.typography.body2.fontSize, // Equivalent to text-sm
});

const getBlockCodeSx = (theme: ReturnType<typeof useTheme>): SxProps => ({
  display: 'block',
  whiteSpace: 'pre',
  fontSize: theme.typography.body2.fontSize,
});

const getLanguageLabelSx = (theme: ReturnType<typeof useTheme>): SxProps => ({
  position: 'absolute',
  top: theme.spacing(1),
  right: theme.spacing(4),
  px: 1,
  py: 0.5,
  borderRadius: 1,
  backgroundColor: theme.palette.action.selected,
  color: theme.palette.text.secondary,
  fontSize: '0.75rem',
  zIndex: 40,
  opacity: 0.8,
  pointerEvents: 'none', // Prevent label from interfering with selection
});

const getCopyButtonSx = (theme: ReturnType<typeof useTheme>): SxProps => ({
  position: 'absolute',
  top: theme.spacing(0.5),
  right: theme.spacing(0.5),
  color: theme.palette.action.active,
  zIndex: 1,
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
});

const ReactMarkdownWithCodeCopy: React.FC<ReactMarkdownWithCodeCopyProps> = ({
  children,
}) => {
  const theme = useTheme();

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw, rehypeSanitize, rehypeHighlight]}
      components={{
        // Override 'pre' to add the language label and copy button around the highlighted code block
        // The 'children' here will be the <code> element already processed by rehype-highlight
        pre: ({ node, children: preChildren, ...props }) => {
          // preChildren will typically be a single <code> element
          const codeElement = React.Children.toArray(preChildren)[0];

          // Safely extract raw text for copying
          // This handles cases where children might be string, or array of string/elements
          const rawCodeText = (
            codeElement &&
            typeof codeElement === 'object' &&
            'props' in codeElement &&
            typeof codeElement.props === 'object' &&
            'children' in codeElement.props
              ? String(codeElement.props.children || '')
              : ''
          ).replace(/\n$/, '');

          // Extract language from the className of the <code> element
          const codeClassName = (
            codeElement &&
            typeof codeElement === 'object' &&
            'props' in codeElement &&
            typeof codeElement.props === 'object' &&
            'className' in codeElement.props
              ? String(codeElement.props.className)
              : ''
          );
          const languageMatch = codeClassName.match(/language-(\w+)/);
          const language = languageMatch ? languageMatch[1] : '';

          return (
            <Box
              sx={getCodeBlockContainerSx(theme)}
              className="group" // Retain 'group' for Tailwind's group-hover utility
            >
              {language && (
                <Typography variant="caption" sx={getLanguageLabelSx(theme)}>
                  {language}
                </Typography>
              )}
              {preChildren}
              {language && (
                <Tooltip title="Copy code to clipboard">
                  <IconButton
                    aria-label="copy code"
                    onClick={() => handleCopy(rawCodeText)}
                    sx={getCopyButtonSx(theme)}
                    size="small"
                  >
                    <FileCopyIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          );
        },
        // Override 'code' for inline code styling only.
        // For block code, the 'pre' override handles the wrapping around the highlighted <code>.
        code: ({ node, inline, className, children, ...props }) => {
          if (inline) {
            return (
              <Box
                component="code"
                sx={getInlineCodeSx(theme)}
                {...props}
              >
                {children}
              </Box>
            );
          }
          // For block code, let ReactMarkdown render the <code> tag as it would normally,
          // ensuring rehypeHighlight can process it.
          // Apply styles directly via sx.
          return (
            <code
              className={`${className || ''}`}
              style={{ color: theme.palette.text.primary }} // Ensure highlighted code text color matches primary text
              sx={getBlockCodeSx(theme)}
              {...props}
            >
              {children}
            </code>
          );
        },
      }}
    >
      {children}
    </ReactMarkdown>
  );
};

export default ReactMarkdownWithCodeCopy;
