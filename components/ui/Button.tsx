
import React, { ReactNode, ElementType, ComponentPropsWithoutRef } from 'react';
import { LoadingSpinner } from './LoadingSpinner';

// Props specific to our Button's functionality and styling
type CustomButtonProps = {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  isLoading?: boolean;
  children?: ReactNode;
  className?: string;
};

// The props for the component, allowing it to be polymorphic
// It combines our custom props with the props of the element specified by 'as',
// omitting any conflicting keys from the 'as' component's props to prioritize our definitions.
export type ButtonProps<C extends ElementType> = CustomButtonProps & {
  as?: C;
} & Omit<ComponentPropsWithoutRef<C>, keyof CustomButtonProps | 'as'>;


const defaultElement = 'button';

export const Button = <C extends ElementType = typeof defaultElement>({
  children,
  variant = 'primary',
  size = 'md',
  leftIcon,
  rightIcon,
  className = '',
  isLoading = false,
  as,
  disabled, // `disabled` is now correctly typed based on the component C
  ...restProps // `restProps` will contain props like `to` if `C` is `typeof Link`
}: ButtonProps<C>) => {
  const Component = as || defaultElement;

  const baseStyles = 'font-semibold rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-150 flex items-center justify-center';

  const variantStyles = {
    primary: 'bg-primary text-white hover:bg-primary-dark focus:ring-primary',
    secondary: 'bg-secondary text-white hover:bg-secondary-dark focus:ring-secondary',
    danger: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500',
    ghost: 'bg-transparent text-primary hover:bg-primary-light/20 focus:ring-primary',
    outline: 'bg-transparent text-primary border border-primary hover:bg-primary-light/20 focus:ring-primary'
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  let spinnerColor = 'text-primary';
  if (variant === 'primary' || variant === 'secondary' || variant === 'danger') {
    spinnerColor = 'text-white';
  }

  const isButtonElement = Component === 'button';
  // The `disabled` prop from `ButtonProps<C>` will be boolean if C is HTMLButtonElement, otherwise likely undefined.
  // `isLoading` is our primary mechanism for disabling.
  const effectivelyDisabled = isLoading || !!disabled;

  // Prepare props to pass to the underlying component.
  const componentSpecificProps: Record<string, any> = { ...restProps };

  if (isButtonElement) {
    // For actual <button> elements, pass the standard 'disabled' attribute.
    componentSpecificProps.disabled = effectivelyDisabled;
  } else if (effectivelyDisabled) {
    // For non-button elements (like <a> from React Router Link), use aria-disabled for accessibility.
    // Visual disabling (opacity, pointer-events) is handled by classNames.
    componentSpecificProps['aria-disabled'] = true;
  }

  return (
    <Component
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${isLoading ? 'cursor-not-allowed opacity-75' : ''} ${!isButtonElement && effectivelyDisabled ? 'opacity-70 pointer-events-none' : ''} ${className}`}
      {...componentSpecificProps}
    >
      {isLoading ? (
        <LoadingSpinner size="sm" color={spinnerColor} />
      ) : (
        <>
          {leftIcon && <span className="mr-2">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="ml-2">{rightIcon}</span>}
        </>
      )}
    </Component>
  );
};