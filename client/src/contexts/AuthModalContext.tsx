import { createContext, useContext, useState, type ReactNode } from "react";

type Tab = "login" | "register";

type AuthModalContextType = {
  isOpen: boolean;
  defaultTab: Tab;
  open: (tab?: Tab) => void;
  close: () => void;
};

const AuthModalContext = createContext<AuthModalContextType>({} as AuthModalContextType);

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [defaultTab, setDefaultTab] = useState<Tab>("login");

  function open(tab: Tab = "login") {
    setDefaultTab(tab);
    setIsOpen(true);
  }

  return (
    <AuthModalContext.Provider value={{ isOpen, defaultTab, open, close: () => setIsOpen(false) }}>
      {children}
    </AuthModalContext.Provider>
  );
}

export function useAuthModal() {
  return useContext(AuthModalContext);
}
