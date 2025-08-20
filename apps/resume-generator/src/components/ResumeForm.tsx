import React, { useState } from 'react';
import { Button } from './common/Button';
import LoadingSpinner from './common/LoadingSpinner';

interface ResumeFormProps {
  onFileUpload: (file: File) => void;
  onGenerateResume: (data: any) => void;
  onOptimizeResume: (data: any) => void;
  onEnhanceResume: (data: any) => void;
  loading: boolean;
}

const ResumeForm: React.FC<ResumeFormProps> = ({
  onFileUpload,
  onGenerateResume,
  onOptimizeResume,
  onEnhanceResume,
  loading,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState<string>('');
  const [targetJobDescription, setTargetJobDescription] = useState<string>('');

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleUploadClick = () => {
    if (selectedFile) {
      onFileUpload(selectedFile);
    }
  };

  const handleGenerateClick = () => {
    // For simplicity, passing resumeText directly for now.
    // In a real app, this would be a structured object.
    onGenerateResume({ resumeText });
  };

  const handleOptimizeClick = () => {
    onOptimizeResume({ resumeText, targetJobDescription });
  };

  const handleEnhanceClick = () => {
    onEnhanceResume({ resumeText, targetJobDescription });
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-8">
      <h2 className="text-xl font-semibold mb-4">Upload or Input Resume</h2>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Upload Resume File (PDF/DOCX)
        </label>
        <div className="mt-1 flex justify-center rounded-md border-2 border-dashed border-gray-300 dark:border-gray-600 px-6 pt-5 pb-6">
          <div className="space-y-1 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
              aria-hidden="true"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4m32-4V12a4 4 0 00-4-4H16L28 8z"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="flex text-sm text-gray-600 dark:text-gray-400">
              <label
                htmlFor="file-upload"
                className="relative cursor-pointer rounded-md bg-white dark:bg-gray-700 font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2"
              >
                <span>Upload a file</span>
                <input
                  id="file-upload"
                  name="file-upload"
                  type="file"
                  className="sr-only"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx"
                />
              </label>
              <p className="pl-1">or drag and drop</p>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {selectedFile ? selectedFile.name : 'PDF or DOCX up to 10MB'}
            </p>
          </div>
        </div>
        <Button
          onClick={handleUploadClick}
          className="mt-4 w-full"
          disabled={!selectedFile || loading}
        >
          {loading ? <LoadingSpinner size="sm" color="text-white" /> : 'Upload Resume'}
        </Button>
      </div>

      <div className="mb-6">
        <label
          htmlFor="resume-text"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Or paste your resume text here:
        </label>
        <textarea
          id="resume-text"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
          rows={10}
          value={resumeText}
          onChange={(e) => setResumeText(e.target.value)}
          placeholder="Paste your resume content or a summary here..."
        />
        <Button
          onClick={handleGenerateClick}
          className="mt-4 w-full"
          disabled={!resumeText.trim() || loading}
        >
          {loading ? <LoadingSpinner size="sm" color="text-white" /> : 'Generate Resume from Text'}
        </Button>
      </div>

      <div className="mb-6">
        <label
          htmlFor="job-description"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Target Job Description (for Optimization/Enhancement):
        </label>
        <textarea
          id="job-description"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
          rows={5}
          value={targetJobDescription}
          onChange={(e) => setTargetJobDescription(e.target.value)}
          placeholder="Paste the job description you are applying for..."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Button
          onClick={handleOptimizeClick}
          variant="secondary"
          disabled={
            (!resumeText.trim() && !selectedFile) || !targetJobDescription.trim() || loading
          }
        >
          {loading ? (
            <LoadingSpinner size="sm" color="text-primary-foreground" />
          ) : (
            'Optimize Resume'
          )}
        </Button>
        <Button
          onClick={handleEnhanceClick}
          variant="outline"
          disabled={
            (!resumeText.trim() && !selectedFile) || !targetJobDescription.trim() || loading
          }
        >
          {loading ? <LoadingSpinner size="sm" color="text-primary" /> : 'Enhance Resume'}
        </Button>
      </div>
    </div>
  );
};

export default ResumeForm;
