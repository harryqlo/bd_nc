
import React, { ReactNode } from 'react';

interface CardProps {
  title?: string;
  children: ReactNode;
  className?: string;
  titleClassName?: string;
  bodyClassName?: string;
  footer?: ReactNode;
  footerClassName?: string;
}

export const Card: React.FC<CardProps> = ({ title, children, className = '', titleClassName = '', bodyClassName = '', footer, footerClassName = '' }) => {
  return (
    <div className={`bg-white dark:bg-slate-800 shadow-lg rounded-lg overflow-hidden ${className}`}>
      {title && (
        <div className={`px-6 py-4 border-b border-gray-200 dark:border-slate-700 ${titleClassName}`}>
          <h3 className="text-xl font-semibold text-gray-800 dark:text-slate-100">{title}</h3>
        </div>
      )}
      <div className={`p-6 ${bodyClassName}`}>
        {children}
      </div>
      {footer && (
        <div className={`px-6 py-4 bg-gray-50 dark:bg-slate-700/50 border-t border-gray-200 dark:border-slate-700 ${footerClassName}`}>
          {footer}
        </div>
      )}
    </div>
  );
};