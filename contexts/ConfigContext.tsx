
import React, { createContext, useState, ReactNode, useContext, useCallback } from 'react';
import { SystemConfig } from '../types';
import { MOCK_SYSTEM_CONFIG } from '../constants';
import { logInfo } from '../utils/logger';

interface ConfigContextType {
  config: SystemConfig;
  setConfig: (newConfig: Partial<SystemConfig>) => void;
  resetConfig: () => void;
}

export const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export const ConfigProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [config, setInternalConfig] = useState<SystemConfig>(MOCK_SYSTEM_CONFIG);

  const setConfig = useCallback((newConfig: Partial<SystemConfig>) => {
    setInternalConfig(prevConfig => ({ ...prevConfig, ...newConfig }));
    // Here you might also persist to localStorage or an API in a real app
    logInfo('System config updated:', { ...config, ...newConfig });
  }, [config]);

  const resetConfig = useCallback(() => {
    setInternalConfig(MOCK_SYSTEM_CONFIG);
    logInfo('System config reset to default.');
  }, []);

  return (
    <ConfigContext.Provider value={{ config, setConfig, resetConfig }}>
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfig = (): ConfigContextType => {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
};
