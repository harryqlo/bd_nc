
import React from 'react';

interface AlertProps {
  type?: 'success' | 'error' | 'warning' | 'info';
  message: string;
  onClose?: () => void;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({ type = 'info', message, onClose, className = '' }) => {
  const baseStyles = 'p-4 mb-4 rounded-md flex items-center text-sm'; // Standardized text size
  
  const typeStyles = {
    success: 'bg-green-100 dark:bg-green-800/30 text-green-700 dark:text-green-300 border border-green-300 dark:border-green-600',
    error: 'bg-red-100 dark:bg-red-800/30 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-600',
    warning: 'bg-yellow-100 dark:bg-yellow-800/30 text-yellow-700 dark:text-yellow-300 border border-yellow-300 dark:border-yellow-600',
    info: 'bg-blue-100 dark:bg-blue-800/30 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-600',
  };

  const Icon = () => {
    const iconClass = "w-5 h-5 mr-3";
    switch (type) {
      case 'success':
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className={iconClass}
            aria-hidden="true"
            focusable="false"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'error':
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className={iconClass}
            aria-hidden="true"
            focusable="false"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        );
      case 'warning':
         return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className={iconClass}
            aria-hidden="true"
            focusable="false"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        );
      default: // Info
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className={iconClass}
            aria-hidden="true"
            focusable="false"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
          </svg>
        );
    }
  };

  if (!message) return null;

  return (
    <div className={`${baseStyles} ${typeStyles[type]} ${className}`} role="alert">
      <Icon />
      <span className="flex-1">{message}</span>
      {onClose && (
        <button 
            onClick={onClose} 
            className={`ml-auto -mx-1.5 -my-1.5 p-1.5 rounded-md focus:outline-none
                        ${type === 'success' ? 'hover:bg-green-200 dark:hover:bg-green-700' : ''}
                        ${type === 'error'   ? 'hover:bg-red-200 dark:hover:bg-red-700' : ''}
                        ${type === 'warning' ? 'hover:bg-yellow-200 dark:hover:bg-yellow-700' : ''}
                        ${type === 'info'    ? 'hover:bg-blue-200 dark:hover:bg-blue-700' : ''}
                        `} 
            aria-label="Cerrar"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-5 h-5"
            aria-hidden="true"
            focusable="false"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
};