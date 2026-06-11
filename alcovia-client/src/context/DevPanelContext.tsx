import React, { createContext, useContext, useMemo, useState } from 'react';
import { DevPanel } from '../components/DevPanel';

type DevPanelContextValue = {
  devOpen: boolean;
  toggleDev: () => void;
  closeDev: () => void;
};

const DevPanelContext = createContext<DevPanelContextValue | null>(null);

export function DevPanelProvider({ children }: { children: React.ReactNode }) {
  const [devOpen, setDevOpen] = useState(false);

  const value = useMemo(
    () => ({
      devOpen,
      toggleDev: () => setDevOpen((v) => !v),
      closeDev: () => setDevOpen(false),
    }),
    [devOpen]
  );

  return (
    <DevPanelContext.Provider value={value}>
      {children}
      <DevPanel visible={devOpen} onClose={() => setDevOpen(false)} />
    </DevPanelContext.Provider>
  );
}

export function useDevPanel() {
  const ctx = useContext(DevPanelContext);
  if (!ctx) throw new Error('useDevPanel must be used within DevPanelProvider');
  return ctx;
}
