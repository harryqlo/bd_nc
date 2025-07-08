
import React, { ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-full h-full',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 dark:bg-opacity-75 transition-opacity duration-300 ease-in-out">
      <div className={`bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 m-4 w-full ${sizeClasses[size]} transform transition-all duration-300 ease-in-out scale-100`}>
        {title && (
          <div className="flex justify-between items-center mb-4 pb-2 border-b border-neutral-200 dark:border-slate-700">
            <h3 className="text-xl font-semibold text-neutral-800 dark:text-slate-100">{title}</h3>
            <button
              onClick={onClose}
              className="text-neutral-400 dark:text-slate-400 hover:text-neutral-600 dark:hover:text-slate-200 transition-colors"
              aria-label="Cerrar modal"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6"
                aria-hidden="true"
                focusable="false"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        <div>{children}</div>
      </div>
    </div>
  );
};