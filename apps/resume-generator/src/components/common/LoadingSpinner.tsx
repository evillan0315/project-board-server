import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = 'text-blue-500',
  className = '',
}) => {
  let spinnerSize = '';
  switch (size) {
    case 'sm':
      spinnerSize = 'w-4 h-4 border-2';
      break;
    case 'lg':
      spinnerSize = 'w-10 h-10 border-4';
      break;
    case 'md':
    default:
      spinnerSize = 'w-6 h-6 border-3';
      break;
  }

  return (
    <div
      className={`inline-block animate-spin rounded-full border-solid border-r-transparent ${spinnerSize} ${color} ${className}`}
      role="status"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export default LoadingSpinner;
