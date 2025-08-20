import React, { useState, useCallback, ChangeEvent } from 'react';
import TextField from './ui/TextField';
import Button from './ui/Button';
import CircularProgress from './ui/CircularProgress';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import ArticleIcon from '@mui/icons-material/Article';
import DescriptionIcon from '@mui/icons-material/Description';

interface ResumeFormProps {
  onParse: (file: File) => Promise<void>;
  onOptimize: (jobDescription: string, resumeContent?: string, resumeFile?: File) => Promise<void>;
  loading: { parse: boolean; optimize: boolean };
  parsedResumeText: string;
  resumeContent: string;
  jobDescription: string;
  setResumeContent: (content: string) => void;
  setJobDescription: (jd: string) => void;
}

const ResumeForm: React.FC<ResumeFormProps> = ({
  onParse,
  onOptimize,
  loading,
  parsedResumeText,
  resumeContent,
  jobDescription,
  setResumeContent,
  setJobDescription,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [resumeTextInput, setResumeTextInput] = useState<string>(resumeContent);
  const [jobDescriptionInput, setJobDescriptionInput] = useState<string>(jobDescription);

  // Update local state when prop changes, allowing external updates from other sections (e.g., generated resume)
  React.useEffect(() => {
    setResumeTextInput(resumeContent);
  }, [resumeContent]);

  React.useEffect(() => {
    setJobDescriptionInput(jobDescription);
  }, [jobDescription]);

  const handleFileChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setSelectedFile(file);
      setResumeTextInput(''); // Clear text input when file is selected
    }
  }, []);

  const handleParseClick = useCallback(async () => {
    if (selectedFile) {
      await onParse(selectedFile);
    }
  }, [selectedFile, onParse]);

  const handleOptimizeClick = useCallback(async () => {
    // Prioritize file upload if selected, otherwise use text input
    if (selectedFile) {
      await onOptimize(jobDescriptionInput, undefined, selectedFile);
    } else if (resumeTextInput.trim() !== '') {
      await onOptimize(jobDescriptionInput, resumeTextInput);
    } else {
      // This case should ideally be caught by validation on the page level or API
      alert('Please provide either a resume file or resume text content.');
    }
  }, [selectedFile, resumeTextInput, jobDescriptionInput, onOptimize]);

  const handleResumeTextChange = useCallback(
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setResumeTextInput(e.target.value);
      setResumeContent(e.target.value); // Update nanostore immediately
      setSelectedFile(null); // Clear selected file if user starts typing
    },
    [setResumeContent],
  );

  const handleJobDescriptionChange = useCallback(
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setJobDescriptionInput(e.target.value);
      setJobDescription(e.target.value); // Update nanostore immediately
    },
    [setJobDescription],
  );

  return (
    <Box className="flex flex-col gap-4">
      <Typography variant="h6" className="!font-semibold !text-gray-800">
        1. Upload or Input Your Resume
      </Typography>
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 flex flex-col gap-2 p-4 border border-gray-200 rounded-lg shadow-sm">
          <Typography
            variant="subtitle1"
            className="!font-medium !text-gray-700 flex items-center gap-2"
          >
            <CloudUploadIcon /> Upload Resume File (PDF, DOCX)
          </Typography>
          <input
            accept=".pdf,.docx"
            style={{ display: 'none' }}
            id="resume-file-upload"
            type="file"
            onChange={handleFileChange}
          />
          <label htmlFor="resume-file-upload">
            <Button
              variant="contained"
              component="span"
              disabled={loading.parse}
              className="!bg-blue-600 hover:!bg-blue-700 !text-white"
            >
              {selectedFile ? selectedFile.name : 'Choose File'}
            </Button>
          </label>
          <Button
            variant="outlined"
            onClick={handleParseClick}
            disabled={!selectedFile || loading.parse}
            className="!border-blue-600 !text-blue-600 hover:!border-blue-700 hover:!text-blue-700"
            startIcon={loading.parse && <CircularProgress size={20} color="primary" />}
          >
            {loading.parse ? 'Parsing...' : 'Parse File to Text'}
          </Button>
        </div>
        <div className="flex-1 flex flex-col gap-2 p-4 border border-gray-200 rounded-lg shadow-sm">
          <Typography
            variant="subtitle1"
            className="!font-medium !text-gray-700 flex items-center gap-2"
          >
            <ArticleIcon /> Or Enter Resume Text Manually
          </Typography>
          <TextField
            label="Resume Content"
            multiline
            rows={10}
            value={resumeTextInput}
            onChange={handleResumeTextChange}
            placeholder="Paste your resume content here..."
            className="w-full"
          />
        </div>
      </div>

      <Typography variant="h6" className="!font-semibold !text-gray-800">
        2. Provide Job Description
      </Typography>
      <TextField
        label="Job Description"
        multiline
        rows={8}
        value={jobDescriptionInput}
        onChange={handleJobDescriptionChange}
        placeholder="Paste the job description here..."
        className="w-full"
        InputProps={{ startAdornment: <DescriptionIcon className="mr-2" /> }}
      />

      <Button
        variant="contained"
        color="primary"
        onClick={handleOptimizeClick}
        disabled={
          loading.optimize ||
          (!selectedFile && !resumeTextInput.trim()) ||
          !jobDescriptionInput.trim()
        }
        className="!bg-green-600 hover:!bg-green-700 !text-white !py-3 !text-lg !font-bold"
        startIcon={loading.optimize && <CircularProgress size={24} color="inherit" />}
      >
        {loading.optimize ? 'Optimizing...' : 'Optimize Resume'}
      </Button>
    </Box>
  );
};

export default ResumeForm;
