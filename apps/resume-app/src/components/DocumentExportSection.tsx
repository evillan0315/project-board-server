import React, { useState, useCallback, useEffect } from 'react';
import TextField from './ui/TextField';
import Button from './ui/Button';
import CircularProgress from './ui/CircularProgress';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import DownloadIcon from '@mui/icons-material/Download';
import HtmlIcon from '@mui/icons-material/Html';
import DescriptionIcon from '@mui/icons-material/Description';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import WebIcon from '@mui/icons-material/Web'; // Portfolio Icon
import MailIcon from '@mui/icons-material/MailOutline'; // Cover Letter Icon
import ArticleIcon from '@mui/icons-material/Article'; // Resume Icon
import { OutputFormat } from '@/types/resume';

interface DocumentExportSectionProps {
  onExport: (content: string, format: OutputFormat, filename: string) => Promise<void>;
  loading: boolean;
  resumeContent: string;
  portfolioContent: string;
  coverLetterContent: string;
  jobDescription: string;
}

type ContentType = 'resume' | 'portfolio' | 'coverLetter';

const DocumentExportSection: React.FC<DocumentExportSectionProps> = ({
  onExport,
  loading,
  resumeContent,
  portfolioContent,
  coverLetterContent,
  jobDescription,
}) => {
  const [exportFormat, setExportFormat] = useState<OutputFormat>(OutputFormat.HTML);
  const [filename, setFilename] = useState('document');
  const [selectedContentType, setSelectedContentType] = useState<ContentType>('resume');

  // Determine the content to display/export based on selection
  const currentContentToExport = React.useMemo(() => {
    if (selectedContentType === 'resume') return resumeContent;
    if (selectedContentType === 'portfolio') return portfolioContent;
    if (selectedContentType === 'coverLetter') return coverLetterContent;
    return '';
  }, [selectedContentType, resumeContent, portfolioContent, coverLetterContent]);

  // Update filename based on selected content type and job description
  useEffect(() => {
    let newFilename = '';
    const baseName = jobDescription.trim() ? jobDescription.split(' ')[0].toLowerCase() + '_' : '';
    if (selectedContentType === 'resume') {
      newFilename = `${baseName}resume`;
    } else if (selectedContentType === 'portfolio') {
      newFilename = `${baseName}portfolio`;
    } else if (selectedContentType === 'coverLetter') {
      newFilename = `${baseName}cover_letter`;
    }
    setFilename(newFilename || 'document');
  }, [selectedContentType, jobDescription]);

  const handleExportClick = useCallback(async () => {
    if (currentContentToExport.trim()) {
      await onExport(currentContentToExport, exportFormat, filename);
    } else {
      alert(`No ${selectedContentType} content available to export.`);
    }
  }, [currentContentToExport, exportFormat, filename, onExport, selectedContentType]);

  // Determine appropriate label for the content based on selected format and content type
  const getContentLabel = () => {
    const contentTypeName = selectedContentType.replace(/([A-Z])/g, ' $1').toLowerCase();
    if (exportFormat === OutputFormat.PDF || exportFormat === OutputFormat.DOCX_FROM_HTML) {
      return `HTML Content (for PDF/DOCX) - ${contentTypeName}`;
    }
    return `Markdown Content (for HTML/DOCX/TXT/JSON) - ${contentTypeName}`;
  };

  return (
    <Box className="flex flex-col gap-6 p-4 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm transition-colors duration-300">
      <Typography
        variant="h6"
        className="!font-semibold !text-gray-800 dark:!text-gray-200 flex items-center gap-2 mb-4 transition-colors duration-300"
      >
        <DownloadIcon /> Export Document
      </Typography>

      <FormControl component="fieldset" className="mb-4">
        <FormLabel
          component="legend"
          className="!text-gray-700 dark:!text-gray-300 !font-medium transition-colors duration-300"
        >
          Select Document Type to Export
        </FormLabel>
        <RadioGroup
          row
          aria-label="content-type"
          name="content-type-group"
          value={selectedContentType}
          onChange={(e) => setSelectedContentType(e.target.value as ContentType)}
        >
          <FormControlLabel
            value="resume"
            control={<Radio color="primary" />}
            label={
              <Box className="flex items-center gap-1 !text-gray-800 dark:!text-gray-200">
                <ArticleIcon fontSize="small" /> Resume
              </Box>
            }
            disabled={!resumeContent.trim()}
          />
          <FormControlLabel
            value="portfolio"
            control={<Radio color="primary" />}
            label={
              <Box className="flex items-center gap-1 !text-gray-800 dark:!text-gray-200">
                <WebIcon fontSize="small" /> Portfolio
              </Box>
            }
            disabled={!portfolioContent.trim()}
          />
          <FormControlLabel
            value="coverLetter"
            control={<Radio color="primary" />}
            label={
              <Box className="flex items-center gap-1 !text-gray-800 dark:!text-gray-200">
                <MailIcon fontSize="small" /> Cover Letter
              </Box>
            }
            disabled={!coverLetterContent.trim()}
          />
        </RadioGroup>
      </FormControl>

      <TextField
        label={getContentLabel()}
        multiline
        rows={10}
        value={currentContentToExport}
        InputProps={{
          readOnly: true,
        }}
        placeholder="Select a document type to see its content here..."
        className="w-full mb-4"
      />

      <FormControl component="fieldset" className="mb-4">
        <FormLabel
          component="legend"
          className="!text-gray-700 dark:!text-gray-300 !font-medium transition-colors duration-300"
        >
          Choose Export Format
        </FormLabel>
        <RadioGroup
          row
          aria-label="export-format"
          name="export-format-group"
          value={exportFormat}
          onChange={(e) => setExportFormat(e.target.value as OutputFormat)}
        >
          <FormControlLabel
            value={OutputFormat.HTML}
            control={<Radio color="primary" />}
            label={
              <Box className="flex items-center gap-1 !text-gray-800 dark:!text-gray-200">
                <HtmlIcon fontSize="small" /> HTML
              </Box>
            }
          />
          <FormControlLabel
            value={OutputFormat.DOCX}
            control={<Radio color="primary" />}
            label={
              <Box className="flex items-center gap-1 !text-gray-800 dark:!text-gray-200">
                <DescriptionIcon fontSize="small" /> DOCX
              </Box>
            }
          />
          <FormControlLabel
            value={OutputFormat.PDF}
            control={<Radio color="primary" />}
            label={
              <Box className="flex items-center gap-1 !text-gray-800 dark:!text-gray-200">
                <PictureAsPdfIcon fontSize="small" /> PDF
              </Box>
            }
          />
           <FormControlLabel
            value={OutputFormat.PLAIN_TEXT}
            control={<Radio color="primary" />}
            label={
              <Box className="flex items-center gap-1 !text-gray-800 dark:!text-gray-200">
                TXT
              </Box>
            }
          />
        </RadioGroup>
      </FormControl>

      <TextField
        label="Filename (without extension)"
        value={filename}
        onChange={(e) => setFilename(e.target.value)}
        placeholder="e.g., my_document"
        className="w-full mb-4"
      />

      <Button
        variant="contained"
        color="primary"
        onClick={handleExportClick}
        disabled={loading || !currentContentToExport.trim() || !filename.trim()}
        className="!bg-blue-600 hover:!bg-blue-700 !text-white !py-2 !text-md !font-bold"
        startIcon={loading && <CircularProgress size={20} color="inherit" />}
      >
        {loading ? 'Exporting...' : `Export to ${exportFormat.toUpperCase()}`}
      </Button>
    </Box>
  );
};

export default DocumentExportSection;
