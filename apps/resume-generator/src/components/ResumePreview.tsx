import React from 'react';
import { ResumeOutput } from '../types/resume';

interface ResumePreviewProps {
  resumeData: ResumeOutput | null;
}

const ResumePreview: React.FC<ResumePreviewProps> = ({ resumeData }) => {
  if (!resumeData) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md text-center text-gray-500 dark:text-gray-400">
        No resume data to display. Generate or upload a resume.
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Generated/Optimized Resume Preview</h2>
      <div className="prose dark:prose-invert max-w-none">
        {resumeData.sections?.length > 0 ? (
          resumeData.sections.map((section, index) => (
            <div key={index} className="mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                {section.title}
              </h3>
              <ul className="list-disc ml-5">
                {section.content.map((item, itemIndex) => (
                  <li key={itemIndex} className="text-gray-700 dark:text-gray-300">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))
        ) : resumeData.formattedResume ? (
          <div dangerouslySetInnerHTML={{ __html: resumeData.formattedResume }} />
        ) : (
          <p className="text-gray-500 dark:text-gray-400">
            No structured content or formatted resume available.
          </p>
        )}

        {resumeData.optimizationSuggestions && resumeData.optimizationSuggestions.length > 0 && (
          <div className="mt-6 border-t pt-4 border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              Optimization Suggestions
            </h3>
            <ul className="list-disc ml-5">
              {resumeData.optimizationSuggestions.map((suggestion, index) => (
                <li key={index} className="text-gray-700 dark:text-gray-300">
                  {suggestion}
                </li>
              ))}
            </ul>
          </div>
        )}

        {resumeData.rawOutput && (
          <div className="mt-6 border-t pt-4 border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Raw AI Output</h3>
            <pre className="whitespace-pre-wrap break-words bg-gray-100 dark:bg-gray-700 p-4 rounded text-sm text-gray-800 dark:text-gray-200">
              {JSON.stringify(resumeData.rawOutput, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResumePreview;
