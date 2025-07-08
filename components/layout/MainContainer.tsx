import React, { ReactNode } from 'react';

interface MainContainerProps {
  children: ReactNode;
  className?: string;
}

export const MainContainer: React.FC<MainContainerProps> = ({ children, className = '' }) => {
  return (
    <div className={`max-w-7xl mx-auto px-4 ${className}`}>
      {children}
    </div>
  );
};

MainContainer.displayName = 'MainContainer';
