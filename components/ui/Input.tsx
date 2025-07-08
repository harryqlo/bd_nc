
import React, { ForwardedRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  containerClassName?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, id, error, className = '', containerClassName = '', ...props }, ref: ForwardedRef<HTMLInputElement>) => {
    const baseStyles = 'block w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-400';
    const errorStyles = 'border-red-500 focus:ring-red-500 focus:border-red-500';

    return (
      <div className={`mb-4 ${containerClassName}`}>
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
            {label}
          </label>
        )}
        <input
          id={id}
          ref={ref}
          className={`${baseStyles} ${error ? errorStyles : ''} ${className}`}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';