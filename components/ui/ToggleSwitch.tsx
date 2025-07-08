import React from 'react';

interface ToggleSwitchProps {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  labelPosition?: 'left' | 'right';
  containerClassName?: string;
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  id,
  label,
  checked,
  onChange,
  disabled = false,
  labelPosition = 'right',
  containerClassName = '',
}) => {
  const handleToggle = () => {
    if (!disabled) {
      onChange(!checked);
    }
  };

  return (
    <div className={`flex items-center ${containerClassName}`}>
      {labelPosition === 'left' && (
        <label htmlFor={id} className={`mr-3 text-sm font-medium text-neutral-700 ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
          {label}
        </label>
      )}
      <button
        type="button"
        id={id}
        role="switch"
        aria-checked={checked}
        onClick={handleToggle}
        disabled={disabled}
        className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary
          ${checked ? 'bg-primary' : 'bg-neutral-300'}
          ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
      >
        <span
          className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-200 ease-in-out
            ${checked ? 'translate-x-6' : 'translate-x-1'}`}
        />
      </button>
      {labelPosition === 'right' && (
        <label htmlFor={id} className={`ml-3 text-sm font-medium text-neutral-700 ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
          {label}
        </label>
      )}
    </div>
  );
};
