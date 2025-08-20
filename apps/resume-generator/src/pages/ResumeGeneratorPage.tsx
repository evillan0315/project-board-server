import React from 'react';
import { useStore } from '@nanostores/react';
import { resumeStore } from '../stores/resumeStore';
import ResumeForm from '../components/ResumeForm';
import ResumePreview from '../components/ResumePreview';
import { resumeService } from '../api/resumeService';
import {
  GenerateResumePayload,
  OptimizeResumePayload,
  EnhanceResumePayload,
} from '../types/resume';
import LoadingSpinner from '../components/common/LoadingSpinner';

const ResumeGeneratorPage: React.FC = () => {
  const $resume = useStore(resumeStore);

  const handleFileUpload = async (file: File) => {
    resumeStore.setKey('loading', true);
    resumeStore.setKey('error', null);
    try {
      const filePath = await resumeService.uploadResume(file);
      resumeStore.setKey('currentResumeInput', `Uploaded file: ${filePath}`);
      resumeStore.setKey('resumeOutput', null); // Clear previous output
      alert(`Resume uploaded successfully: ${filePath}`);
    } catch (error: any) {
      resumeStore.setKey('error', error.message || 'Failed to upload resume.');
    } finally {
      resumeStore.setKey('loading', false);
    }
  };

  const handleGenerateResume = async (data: { resumeText: string }) => {
    resumeStore.setKey('loading', true);
    resumeStore.setKey('error', null);
    try {
      const payload: GenerateResumePayload = {
        text: data.resumeText,
        outputFormat: 'json', // Or 'markdown', 'pdf_base64'
        model: 'gemini-pro', // Specify model if needed
      };
      const result = await resumeService.generateResume(payload);
      resumeStore.setKey('resumeOutput', result);
    } catch (error: any) {
      resumeStore.setKey('error', error.message || 'Failed to generate resume.');
    } finally {
      resumeStore.setKey('loading', false);
    }
  };

  const handleOptimizeResume = async (data: {
    resumeText: string;
    targetJobDescription: string;
  }) => {
    resumeStore.setKey('loading', true);
    resumeStore.setKey('error', null);
    try {
      const payload: OptimizeResumePayload = {
        resumeContent: data.resumeText,
        jobDescription: data.targetJobDescription,
        outputFormat: 'json', // Requesting structured JSON for optimization suggestions
      };
      const result = await resumeService.optimizeResume(payload);
      resumeStore.setKey('resumeOutput', result);
    } catch (error: any) {
      resumeStore.setKey('error', error.message || 'Failed to optimize resume.');
    } finally {
      resumeStore.setKey('loading', false);
    }
  };

  const handleEnhanceResume = async (data: {
    resumeText: string;
    targetJobDescription: string;
  }) => {
    resumeStore.setKey('loading', true);
    resumeStore.setKey('error', null);
    try {
      const payload: EnhanceResumePayload = {
        resumeContent: data.resumeText,
        jobDescription: data.targetJobDescription,
        outputFormat: 'markdown', // Requesting markdown for enhanced resume output
      };
      const result = await resumeService.enhanceResume(payload);
      // Assuming enhanceResume returns a string (markdown or HTML) directly
      resumeStore.setKey('resumeOutput', {
        formattedResume: result,
        sections: [],
        optimizationSuggestions: [],
      });
    } catch (error: any) {
      resumeStore.setKey('error', error.message || 'Failed to enhance resume.');
    } finally {
      resumeStore.setKey('loading', false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div>
        <ResumeForm
          onFileUpload={handleFileUpload}
          onGenerateResume={handleGenerateResume}
          onOptimizeResume={handleOptimizeResume}
          onEnhanceResume={handleEnhanceResume}
          loading={$resume.loading}
        />

        {$resume.error && (
          <div className="mt-4 p-4 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-md shadow-sm">
            Error: {$resume.error}
          </div>
        )}
      </div>

      <div>
        {$resume.loading && !$resume.resumeOutput && (
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner size="lg" />
          </div>
        )}
        {($resume.resumeOutput || !$resume.loading) && (
          <ResumePreview resumeData={$resume.resumeOutput} />
        )}
      </div>
    </div>
  );
};

export default ResumeGeneratorPage;
